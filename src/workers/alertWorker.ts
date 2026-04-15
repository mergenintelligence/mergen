import { supabase } from '../lib/supabase';

type ScoreRow = {
  score: number | string;
  date: string;
};

type AlertType = 'threshold' | 'momentum' | 'divergence';

function findSevenDayReference(scores: ScoreRow[]): number | null {
  if (scores.length === 0) {
    return null;
  }

  const latestDate = new Date(scores[0].date);
  const targetDate = new Date(latestDate);
  targetDate.setDate(targetDate.getDate() - 7);

  const reference = scores.find((entry) => new Date(entry.date) <= targetDate);
  return reference ? Number(reference.score) : null;
}

function buildDeltaMessage(label: string, delta: number): string {
  const direction = delta > 0 ? 'yukseldi' : 'geriledi';
  return `${label} son 7 gunde ${Math.abs(delta).toFixed(1)} puan ${direction}.`;
}

function getMetricDirection(latest: number | null, previous: number | null) {
  if (latest === null || previous === null) return 'flat';
  if (latest > previous) return 'up';
  if (latest < previous) return 'down';
  return 'flat';
}

export async function runAlertEngine() {
  console.log('Starting Alert Engine...');

  const newAlerts: { type: AlertType; message: string }[] = [];

  await supabase
    .from('alerts')
    .update({ is_active: false })
    .eq('is_active', true);

  const { data: totalScores, error: totalScoresError } = await supabase
    .from('scores')
    .select('score, date')
    .eq('entity_type', 'total')
    .order('date', { ascending: false })
    .limit(30);

  if (!totalScoresError && totalScores && totalScores.length > 0) {
    const latestTotal = Number(totalScores[0].score);
    const referenceTotal = findSevenDayReference(totalScores);

    if (referenceTotal !== null) {
      const delta = latestTotal - referenceTotal;
      const absDelta = Math.abs(delta);

      if (absDelta > 10) {
        newAlerts.push({
          type: 'threshold',
          message: `Esik asildi: ${buildDeltaMessage('Mergen Index', delta)}`,
        });
      } else if (absDelta > 5) {
        newAlerts.push({
          type: 'momentum',
          message: `Momentum bozuldu: ${buildDeltaMessage('Mergen Index', delta)}`,
        });
      }
    }
  }

  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name');

  if (!categoriesError && categories) {
    for (const category of categories) {
      const { data: scoreHistory } = await supabase
        .from('scores')
        .select('score, date')
        .eq('entity_type', 'category')
        .eq('entity_id', category.id)
        .order('date', { ascending: false })
        .limit(30);

      if (!scoreHistory || scoreHistory.length === 0) {
        continue;
      }

      const score = Number(scoreHistory[0].score);
      const reference = findSevenDayReference(scoreHistory as ScoreRow[]);
      const delta = reference !== null ? score - reference : null;

      if (score < 25) {
        newAlerts.push({
          type: 'threshold',
          message: `Esik asildi: ${category.name} kategori skoru kritik esik altinda (${score}/100).`,
        });
      } else if (score < 40) {
        newAlerts.push({
          type: 'threshold',
          message: `Esik asildi: ${category.name} kategori skoru baskili bolgede (${score}/100).`,
        });
      }

      if (delta !== null && delta <= -8) {
        newAlerts.push({
          type: 'momentum',
          message: `Momentum bozuldu: ${category.name} son 7 gunde ${Math.abs(delta).toFixed(1)} puan geriledi.`,
        });
      }
    }
  }

  const watchSymbols = [
    'PM_US_RECESSION_PROB',
    'BAMLH0A0HYM2',
    'GLD',
    'VIXCLS',
    'VIX_DERIV',
    'SPY',
    'RSP_SPY_RATIO',
    'AD_LINE',
  ];

  const { data: watchedMetrics } = await supabase
    .from('metrics')
    .select('id, symbol')
    .in('symbol', watchSymbols);

  if (watchedMetrics && watchedMetrics.length > 0) {
    const metricIdBySymbol = new Map(watchedMetrics.map((metric) => [metric.symbol, metric.id]));
    const metricSeries = new Map<string, Array<{ value: number; date: string }>>();

    for (const symbol of watchSymbols) {
      const metricId = metricIdBySymbol.get(symbol);
      if (!metricId) continue;

      const { data: rows } = await supabase
        .from('metric_values')
        .select('value, date')
        .eq('metric_id', metricId)
        .order('date', { ascending: false })
        .limit(2);

      metricSeries.set(
        symbol,
        (rows ?? []).map((row) => ({ value: Number(row.value), date: row.date })),
      );
    }

    const direction = (symbol: string) => {
      const rows = metricSeries.get(symbol) ?? [];
      return getMetricDirection(rows[0]?.value ?? null, rows[1]?.value ?? null);
    };

    if (direction('PM_US_RECESSION_PROB') === 'up' && direction('BAMLH0A0HYM2') !== 'up') {
      newAlerts.push({
        type: 'divergence',
        message: 'Piyasa ile veri ayrıştı: Prediction market resesyon fiyatliyor ama kredi spread acilmiyor.',
      });
    }

    if (direction('GLD') === 'up' && direction('VIXCLS') !== 'up' && direction('VIX_DERIV') !== 'up') {
      newAlerts.push({
        type: 'divergence',
        message: 'Piyasa ile veri ayrıştı: Altin yukseliyor ama VIX sakin kaliyor.',
      });
    }

    if ((direction('RSP_SPY_RATIO') === 'down' || direction('AD_LINE') === 'down') && direction('SPY') === 'up') {
      newAlerts.push({
        type: 'divergence',
        message: 'Piyasa ile veri ayrıştı: Breadth bozuluyor ama endeks yuksek kaliyor.',
      });
    }
  }

  if (newAlerts.length > 0) {
    const { error } = await supabase.from('alerts').insert(newAlerts);
    if (error) {
      console.error('Error saving alerts:', error);
      throw error;
    }
  }

  console.log(`Alert Engine completed. Active alerts: ${newAlerts.length}`);
}

import { supabase } from '../lib/supabase';

type ScoreRow = {
  score: number | string;
  date: string;
};

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

export async function runAlertEngine() {
  console.log('Starting Alert Engine...');

  const newAlerts: { type: 'yellow' | 'red' | 'category' | 'cross_risk'; message: string }[] = [];

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
          type: 'red',
          message: buildDeltaMessage('Mergen Index', delta),
        });
      } else if (absDelta > 5) {
        newAlerts.push({
          type: 'yellow',
          message: buildDeltaMessage('Mergen Index', delta),
        });
      }
    }
  }

  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name');

  if (!categoriesError && categories) {
    const stressedCategories: string[] = [];

    for (const category of categories) {
      const { data: latestCategoryScore } = await supabase
        .from('scores')
        .select('score')
        .eq('entity_type', 'category')
        .eq('entity_id', category.id)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (!latestCategoryScore) {
        continue;
      }

      const score = Number(latestCategoryScore.score);
      if (score < 25) {
        stressedCategories.push(category.name);
        newAlerts.push({
          type: 'category',
          message: `${category.name} kategori skoru kritik esik altinda (${score}/100).`,
        });
      }
    }

    if (stressedCategories.length >= 2) {
      newAlerts.push({
        type: 'cross_risk',
        message: `Capraz risk sinyali: ${stressedCategories.slice(0, 2).join(' ve ')} birlikte kritik bolgede.`,
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

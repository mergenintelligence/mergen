import { supabase } from '../lib/supabase';
import { calculateMetricScore, calculateCategoryScore } from '../lib/scoring';

const SOCIAL_STABILITY_CATEGORY_ID = '30000000-0000-0000-0000-000000000001';
const TECHNOLOGY_CATEGORY_ID = '30000000-0000-0000-0000-000000000002';
const ETF_CAPITAL_FLOWS_CATEGORY_ID = '30000000-0000-0000-0000-000000000004';
const PRECIOUS_METALS_CATEGORY_ID = '30000000-0000-0000-0000-000000000005';
const AGRI_FOOD_CATEGORY_ID = '30000000-0000-0000-0000-000000000006';
const ENERGY_SECURITY_CATEGORY_ID = '30000000-0000-0000-0000-000000000007';
const CURRENCY_DYNAMICS_CATEGORY_ID = '30000000-0000-0000-0000-000000000008';
const PUBLIC_FINANCE_CATEGORY_ID = '30000000-0000-0000-0000-000000000009';
const EMERGING_MARKETS_CATEGORY_ID = '30000000-0000-0000-0000-000000000010';
const DIRECT_SCORE_SOURCES = new Set(['FED_MANUAL', 'FED_SPEECH', 'ETF_MANUAL', 'STRATEGIC_VALUE']);

function getMetricLookbackYears(metric: { source: string; category_id: string; symbol: string }) {
  if (metric.category_id === SOCIAL_STABILITY_CATEGORY_ID) {
    return 30;
  }

  if (metric.category_id === ETF_CAPITAL_FLOWS_CATEGORY_ID && metric.source === 'ETF_MANUAL') {
    return 8;
  }

  if (metric.source === 'FRED' || metric.source === 'YAHOO' || metric.source === 'FRED_COMPOSITE') {
    return 10;
  }

  return 15;
}

function getMinimumMetricsRequired(categoryId: string) {
  if (categoryId === SOCIAL_STABILITY_CATEGORY_ID) {
    return 2;
  }

  if (categoryId === TECHNOLOGY_CATEGORY_ID) {
    return 1;
  }

  if (categoryId === ETF_CAPITAL_FLOWS_CATEGORY_ID) {
    return 4;
  }

  if (categoryId === PRECIOUS_METALS_CATEGORY_ID) {
    return 2;
  }

  if (categoryId === AGRI_FOOD_CATEGORY_ID) {
    return 2;
  }

  if (categoryId === ENERGY_SECURITY_CATEGORY_ID) {
    return 3;
  }

  if (categoryId === CURRENCY_DYNAMICS_CATEGORY_ID) {
    return 3;
  }

  if (categoryId === PUBLIC_FINANCE_CATEGORY_ID) {
    return 3;
  }

  if (categoryId === EMERGING_MARKETS_CATEGORY_ID) {
    return 3;
  }

  return 3;
}

export async function runScoringEngine() {
  console.log('Starting Scoring Engine...');
  
  // 1. Tüm metrikleri çek
  const { data: metrics, error: metricsError } = await supabase.from('metrics').select('*');
  if (metricsError || !metrics) {
    console.error('Error fetching metrics:', metricsError);
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const categoryScoresMap = new Map<string, { score: number; weight: number }[]>();

  // 2. Her metrik için skor hesapla
  for (const metric of metrics) {
    // Metriğin tüm geçmiş verilerini çek
    const { data: values, error: valuesError } = await supabase
      .from('metric_values')
      .select('value, date')
      .eq('metric_id', metric.id);
      
    if (valuesError || !values || values.length === 0) {
      console.log(`No historical data for metric ${metric.symbol}, skipping.`);
      continue;
    }

    // En güncel veriyi bul (tarihe göre azalan sırada ilk kayıt)
    const { data: latestValueData } = await supabase
      .from('metric_values')
      .select('value, date')
      .eq('metric_id', metric.id)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (!latestValueData) continue;

    const currentValue = Number(latestValueData.value);
    const latestDate = new Date(latestValueData.date);
    const lookbackStart = new Date(latestDate);
    lookbackStart.setFullYear(lookbackStart.getFullYear() - getMetricLookbackYears(metric));

    const historicalValues = values
      .filter((entry) => new Date(entry.date) >= lookbackStart)
      .map((entry) => Number(entry.value));

    if (historicalValues.length === 0) {
      console.log(`No in-window historical data for metric ${metric.symbol}, skipping.`);
      continue;
    }

    // Bazi manuel/yapisal seriler zaten 0-100 skor olarak giriliyor.
    const score = DIRECT_SCORE_SOURCES.has(metric.source)
      ? Math.max(0, Math.min(100, Math.round(currentValue)))
      : calculateMetricScore(currentValue, historicalValues, metric.is_inverse, metric.symbol);

    console.log(`Metric ${metric.symbol} (Value: ${currentValue}) -> Score: ${score}`);

    // Metrik skorunu veritabanına kaydet
    await supabase.from('scores').upsert({
      entity_type: 'metric',
      entity_id: metric.id,
      score: score,
      date: today
    }, { onConflict: 'entity_type, entity_id, date' });

    // Kategori hesaplaması için hafızada tut
    if (!categoryScoresMap.has(metric.category_id)) {
      categoryScoresMap.set(metric.category_id, []);
    }
    categoryScoresMap.get(metric.category_id)!.push({ score, weight: Number(metric.weight) });
  }

  // 3. Kategori Skorlarını Hesapla
  const { data: categories } = await supabase.from('categories').select('*');
  const totalScoresList: { score: number; weight: number }[] = [];

  if (categories) {
    for (const category of categories) {
      const metricsForCategory = categoryScoresMap.get(category.id) || [];
      const minMetricsRequired = getMinimumMetricsRequired(category.id);
      
      if (metricsForCategory.length >= minMetricsRequired) {
        const catScore = calculateCategoryScore(metricsForCategory);
        console.log(`Category ${category.name} -> Score: ${catScore}`);
        
        await supabase.from('scores').upsert({
          entity_type: 'category',
          entity_id: category.id,
          score: catScore,
          date: today
        }, { onConflict: 'entity_type, entity_id, date' });

        totalScoresList.push({ score: catScore, weight: Number(category.weight) });
      } else {
        console.log(`Category ${category.name} -> Missing data (${metricsForCategory.length}/${minMetricsRequired} metrics). Score not calculated.`);
        // Eğer daha önceden hesaplanmış bir skor varsa onu silebiliriz (opsiyonel)
        // await supabase.from('scores').delete().match({ entity_type: 'category', entity_id: category.id, date: today });
      }
    }
  }

  // 4. Genel Mergen Index Skorunu Hesapla
  if (totalScoresList.length > 0) {
    const totalScore = calculateCategoryScore(totalScoresList);
    console.log(`Total Mergen Index -> Score: ${totalScore}`);
    
    await supabase.from('scores').upsert({
      entity_type: 'total',
      entity_id: 'total',
      score: totalScore,
      date: today
    }, { onConflict: 'entity_type, entity_id, date' });
  } else {
    console.log('Total Mergen Index -> Missing data. Score not calculated.');
  }

  console.log('Scoring Engine completed successfully.');
}

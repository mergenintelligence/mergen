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
const CRYPTO_CATEGORY_ID = '30000000-0000-0000-0000-000000000011';
const DIRECT_SCORE_SOURCES = new Set(['FED_MANUAL', 'FED_SPEECH', 'ETF_MANUAL', 'STRATEGIC_VALUE']);

function getMetricLookbackYears(metric: { source: string; category_id: string; symbol: string }) {
  if (metric.category_id === SOCIAL_STABILITY_CATEGORY_ID) {
    return 30;
  }

  if (metric.category_id === ETF_CAPITAL_FLOWS_CATEGORY_ID && metric.source === 'ETF_MANUAL') {
    return 8;
  }

  if (metric.source === 'FRED' || metric.source === 'YAHOO' || metric.source === 'FRED_COMPOSITE' || metric.source === 'CRYPTO_API') {
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

  if (categoryId === CRYPTO_CATEGORY_ID) {
    return 4;
  }

  return 3;
}

export async function runScoringEngine(scopeCategoryId?: string) {
  console.log('Starting Scoring Engine...');
  
  let metricsQuery = supabase.from('metrics').select('*');
  if (scopeCategoryId) {
    metricsQuery = metricsQuery.eq('category_id', scopeCategoryId);
  }

  // 1. Metrikleri çek
  const { data: metrics, error: metricsError } = await metricsQuery;
  if (metricsError || !metrics) {
    console.error('Error fetching metrics:', metricsError);
    return;
  }

  const metricIds = metrics.map((metric) => metric.id);
  const { data: metricRows, error: metricRowsError } = await supabase
    .from('metric_values')
    .select('metric_id, value, date')
    .in('metric_id', metricIds)
    .order('date', { ascending: false });

  if (metricRowsError) {
    console.error('Error fetching metric values:', metricRowsError);
    return;
  }

  const rowsByMetricId = new Map<string, Array<{ value: number | string; date: string }>>();
  for (const row of metricRows ?? []) {
    const existing = rowsByMetricId.get(row.metric_id) ?? [];
    existing.push({ value: row.value, date: row.date });
    rowsByMetricId.set(row.metric_id, existing);
  }

  const today = new Date().toISOString().split('T')[0];
  const categoryScoresMap = new Map<string, { score: number; weight: number }[]>();

  // 2. Her metrik için skor hesapla
  for (const metric of metrics) {
    const values = rowsByMetricId.get(metric.id) || [];

    if (values.length === 0) {
      console.log(`No historical data for metric ${metric.symbol}, skipping.`);
      continue;
    }

    const latestValueData = values[0];

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
  let categoriesQuery = supabase.from('categories').select('*');
  if (scopeCategoryId) {
    categoriesQuery = categoriesQuery.eq('id', scopeCategoryId);
  }
  const { data: categories } = await categoriesQuery;
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
  if (scopeCategoryId) {
    const { data: allCategories } = await supabase.from('categories').select('id, weight');
    const { data: categoryScoreRows } = await supabase
      .from('scores')
      .select('entity_id, score, date')
      .eq('entity_type', 'category')
      .order('date', { ascending: false });

    const latestCategoryScoreMap = new Map<string, number>();
    for (const row of categoryScoreRows ?? []) {
      if (!latestCategoryScoreMap.has(row.entity_id)) {
        latestCategoryScoreMap.set(row.entity_id, Number(row.score));
      }
    }

    for (const category of allCategories ?? []) {
      const score = latestCategoryScoreMap.get(category.id);
      if (score === undefined) continue;
      totalScoresList.push({ score, weight: Number(category.weight) });
    }
  }

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

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { FED_POWER_CATEGORY_ID, fedGovernorProfiles, type FedGovernorProfile } from '../data/fedProfiles';

export interface DashboardData {
  totalScore: number | null;
  totalScoreChange7d: number | null;
  totalScoreTrend: 'up' | 'down' | 'flat';
  lastUpdate: string | null;
  homeInsight: string | null;
  homeSimpleSummary: string | null;
  homeConfidence: number | null;
  aiInsight: string | null;
  aiSimpleSummary: string | null;
  aiConfidence: number | null;
  fedProfiles: FedGovernorProfile[];
  categories: {
    id: string;
    name: string;
    score: number | null;
    change7d: number | null;
    trend: 'up' | 'down' | 'flat';
    fetchedCount: number;
    totalCount: number;
  }[];
  pilotMetrics: {
    id: string;
    name: string;
    symbol: string;
    source: string;
    description: string | null;
    isInverse: boolean;
    latestDate: string | null;
    cadence: 'daily' | 'annual';
    value: number | null;
    change: number | null;
    changePct: number | null;
    trend: 'up' | 'down' | 'flat';
    history: { date: string; value: number }[];
  }[];
  alerts: {
    id: string;
    type: string;
    message: string;
    created_at: string;
  }[];
  news: {
    critical: {
      id: string;
      title: string;
      link: string;
      publishedAt: string | null;
    }[];
    daily: {
      id: string;
      title: string;
      link: string;
      publishedAt: string | null;
    }[];
    other: {
      id: string;
      title: string;
      link: string;
      publishedAt: string | null;
    }[];
  };
  divergences: {
    id: string;
    title: string;
    summary: string;
    category: string;
    severity: 'medium' | 'high';
  }[];
}

type DivergenceMetricValue = {
  symbol: string;
  name: string;
  latest: number | null;
  previous: number | null;
};

function getMetricCadence(source: string): 'daily' | 'annual' {
  if ([
    'VDEM',
    'WORLD_HAPPINESS',
    'WID',
    'EDELMAN',
    'CORNELL_ILR',
    'ELECTION_DATA',
    'SOCIAL_MANUAL',
    'TECH_MANUAL',
    'PRECIOUS_MANUAL',
    'AGRI_MANUAL',
    'CREDIT_MANUAL',
    'REAL_ECON_MANUAL',
    'HYPERSCALER_CAPEX',
    'IEA',
    'TSMC_STRUCTURAL',
    'STRATEGIC_VALUE',
    'FED_SPEECH',
    'FED_MANUAL',
    'ETF_MANUAL',
  ].includes(source)) {
    return 'annual';
  }

  return 'daily';
}

function getScoreTrend(latest: number | null, reference: number | null): 'up' | 'down' | 'flat' {
  if (latest === null || reference === null) {
    return 'flat';
  }

  if (latest > reference) return 'up';
  if (latest < reference) return 'down';
  return 'flat';
}

function findSevenDayReference<T extends { date: string; score: number | string }>(rows: T[]): number | null {
  if (rows.length === 0) {
    return null;
  }

  const latestDate = new Date(rows[0].date);
  const targetDate = new Date(latestDate);
  targetDate.setDate(targetDate.getDate() - 7);

  const reference = rows.find((row) => new Date(row.date) <= targetDate);
  return reference ? Number(reference.score) : null;
}

function parseAiInsight(summary: string | null): {
  expertSummary: string | null;
  simpleSummary: string | null;
  confidence: number | null;
} {
  if (!summary) {
    return { expertSummary: null, simpleSummary: null, confidence: null };
  }

  const match = summary.match(/\[CONFIDENCE:(\d)\]\s*$/);
  const withoutConfidence = match
    ? summary.replace(/\[CONFIDENCE:(\d)\]\s*$/, '').trim()
    : summary.trim();

  const normalized = withoutConfidence
    .replace(/\*\*/g, '')
    .replace(/__+/g, '')
    .replace(/Sade Özet/gi, 'SADE OZET')
    .replace(/Sade Ozet/gi, 'SADE OZET')
    .replace(/Uzman Yorum/gi, 'UZMAN YORUM');

  const expertMatch = normalized.match(
    /UZMAN YORUM\s*:?\s*([\s\S]*?)(?:\n\s*\n?SADE OZET\s*:|$)/i,
  );
  const simpleMatch = normalized.match(/SADE OZET\s*:?\s*([\s\S]*)$/i);

  const expertSummary = expertMatch ? expertMatch[1].trim() : withoutConfidence;
  const rawSimpleSummary = simpleMatch ? simpleMatch[1].trim() : null;
  const simpleSummary = rawSimpleSummary || buildFallbackSimpleSummary(expertSummary);

  if (!match) {
    return { expertSummary, simpleSummary, confidence: null };
  }

  return {
    expertSummary,
    simpleSummary,
    confidence: Number(match[1]),
  };
}

function buildFallbackSimpleSummary(expertSummary: string | null): string | null {
  if (!expertSummary) {
    return null;
  }

  const normalized = expertSummary.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return null;
  }

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return normalized;
  }

  return sentences.slice(0, 2).join(' ');
}

function getMetricDirection(latest: number | null, previous: number | null): 'up' | 'down' | 'flat' {
  if (latest === null || previous === null) {
    return 'flat';
  }

  if (latest > previous) return 'up';
  if (latest < previous) return 'down';
  return 'flat';
}

function buildDivergences(metricValues: Map<string, DivergenceMetricValue>) {
  const divergences: DashboardData['divergences'] = [];

  const getMetric = (symbol: string) => metricValues.get(symbol);
  const direction = (symbol: string) => {
    const metric = getMetric(symbol);
    return getMetricDirection(metric?.latest ?? null, metric?.previous ?? null);
  };

  if (direction('SPY') === 'up' && direction('RSP_SPY_RATIO') === 'down') {
    divergences.push({
      id: 'breadth-fragility',
      title: 'Ralli var ama tabana yayılmıyor',
      summary: 'SPY yükselirken RSP/SPY oranı geriliyor. Yükselişi büyük hisseler taşıyor, piyasa genişliği zayıf.',
      category: 'ETF ve Sermaye Akışı',
      severity: 'high',
    });
  }

  if (direction('SPY') === 'up' && (direction('BAMLH0A0HYM2') === 'up' || direction('STLFSI4') === 'up')) {
    divergences.push({
      id: 'risk-vs-credit',
      title: 'Hisseler güçlü ama kredi stresi eşlik ediyor',
      summary: 'Riskli varlıklar yukarıda kalırken high-yield spread veya finansal stres endeksi bozuluyor. Bu, rallinin kırılgan olabileceğini gösterir.',
      category: 'Kredi ve Finansal Stres',
      severity: 'high',
    });
  }

  if (direction('T10YIE') === 'down' && (direction('STICKCPIM158SFRBATL') === 'up' || direction('MEDCPIM158SFRBCLE') === 'up')) {
    divergences.push({
      id: 'inflation-stickiness',
      title: 'Beklenti gevşiyor ama kalıcı enflasyon dirençli',
      summary: 'Piyasa bazlı enflasyon beklentisi gerilerken Sticky veya Median CPI yukarı gidiyor. Yüzeyde rahatlama var ama çekirdek baskı sürüyor.',
      category: 'Enflasyon Baskıları',
      severity: 'high',
    });
  }

  if (direction('GLD') === 'up' && direction('DFII10') === 'up') {
    divergences.push({
      id: 'gold-real-rates',
      title: 'Altın yükseliyor ama reel faiz de yükseliyor',
      summary: 'Normalde reel faiz artışı altını baskılar. İkisinin aynı anda güçlenmesi, fiyatlamada ekstra korku veya rezerv talebi olabileceğini düşündürür.',
      category: 'Değerli Metaller',
      severity: 'medium',
    });
  }

  if (direction('FED_SPEAK_SENTIMENT_MOMENTUM') === 'up' && direction('NFCI') === 'up') {
    divergences.push({
      id: 'fed-vs-conditions',
      title: 'Fed tonu yumuşuyor ama koşullar sıkılaşıyor',
      summary: 'Fed söylemi daha güvercinleşirken finansal koşullar endeksi sıkılaşma sinyali veriyor. Söylem ile piyasa gerçekliği arasında uyumsuzluk oluşuyor.',
      category: 'Fed İçi Güç Dengesi',
      severity: 'medium',
    });
  }

  if (direction('DBA') !== 'up' && (direction('US_DROUGHT_MONITOR') === 'up' || direction('STOCKS_TO_USE_RATIO') === 'down')) {
    divergences.push({
      id: 'agri-supply-risk',
      title: 'Gıda fiyatları sakin ama arz tabanı bozuluyor',
      summary: 'Tarım sepeti henüz sert tepki vermese de kuraklık artıyor veya stok/kullanım oranı düşüyor. Fiyat baskısı gecikmeli gelebilir.',
      category: 'Tarımsal Emtia ve Gıda Güvenliği',
      severity: 'medium',
    });
  }

  if (direction('BTCUSD') === 'up' && direction('TOTAL3') === 'down') {
    divergences.push({
      id: 'crypto-breadth',
      title: 'Bitcoin güçlü ama altcoin breadth zayıf',
      summary: 'BTC yükselirken TOTAL3 geri çekiliyor. Kripto rallisi genele yayılmıyor, piyasa daha savunmacı bir lidere sıkışıyor.',
      category: 'Kripto Para Piyasaları',
      severity: 'medium',
    });
  }

  if (direction('NET_LIQUIDITY') === 'up' && direction('SPY') === 'down') {
    divergences.push({
      id: 'liquidity-vs-equities',
      title: 'Likidite iyileşiyor ama hisse piyasası karşılık vermiyor',
      summary: 'Net likidite artarken SPY zayıf kalıyor. Piyasa ya büyüme korkusu fiyatlıyor ya da likidite henüz riskli varlıklara geçmiyor.',
      category: 'Piyasa Likiditesi',
      severity: 'medium',
    });
  }

  return divergences.slice(0, 6);
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
) {
  const results: R[] = new Array(items.length);
  let index = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const currentIndex = index++;
      results[currentIndex] = await worker(items[currentIndex]);
    }
  });

  await Promise.all(runners);
  return results;
}

export function useDashboardData(selectedCategoryId: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);

  const fetchData = async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        pilotMetrics: [],
        aiInsight: null,
        aiSimpleSummary: null,
        aiConfidence: null,
        fedProfiles: selectedCategoryId === FED_POWER_CATEGORY_ID ? fedGovernorProfiles : [],
        news: selectedCategoryId === 'home' || selectedCategoryId === 'news' ? prev.news : { critical: [], daily: [], other: [] },
        divergences: selectedCategoryId === 'home' ? prev.divergences : [],
      };
    });
    try {
      // 1. Genel Mergen Index Skorunu Çek
      const { data: totalScoreData } = await supabase
        .from('scores')
        .select('score, created_at, date')
        .eq('entity_type', 'total')
        .order('date', { ascending: false })
        .limit(1)
        .single();
      const { data: totalScoreHistory } = await supabase
        .from('scores')
        .select('score, date')
        .eq('entity_type', 'total')
        .order('date', { ascending: false })
        .limit(30);

      // 2. Kategorileri ve Skorlarını Çek
      const { data: categories } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
      const { data: catScores } = await supabase
        .from('scores')
        .select('*')
        .eq('entity_type', 'category')
        .order('date', { ascending: false });

      // Get metric counts for each category
      const { data: allMetrics } = await supabase.from('metrics').select('id, category_id');
      const { data: allValues } = await supabase.from('metric_values').select('metric_id').order('date', { ascending: false });

      const categoryList = categories?.map(cat => {
        // İlgili kategorinin en güncel skorunu bul
        const categoryHistory = catScores?.filter(s => s.entity_id === cat.id) || [];
        const scoreObj = categoryHistory[0];
        const currentScore = scoreObj ? Number(scoreObj.score) : null;
        const referenceScore = findSevenDayReference(
          categoryHistory.map((entry) => ({
            score: Number(entry.score),
            date: entry.date,
          })),
        );
        
        // Calculate fetched vs total metrics
        const catMetrics = allMetrics?.filter(m => m.category_id === cat.id) || [];
        const totalCount = catMetrics.length;
        
        // Count how many of these metrics have at least one value
        const fetchedCount = catMetrics.filter(m => 
          allValues?.some(v => v.metric_id === m.id)
        ).length;

        return {
          id: cat.id,
          name: cat.name,
          score: currentScore,
          change7d:
            currentScore !== null && referenceScore !== null
              ? currentScore - referenceScore
              : null,
          trend: getScoreTrend(currentScore, referenceScore),
          fetchedCount,
          totalCount
        };
      }) || [];

      // 3. Seçili Kategori Metriklerini Çek
      let metrics = null;
      let insightData = null;
      let homeInsightData = null;
      let divergences: DashboardData['divergences'] = [];
      let newsData: DashboardData['news'] = { critical: [], daily: [], other: [] };

      if (selectedCategoryId === 'home' || selectedCategoryId === 'news') {
        try {
          const response = await fetch('/api/news');
          const payload = await response.json();
          if (response.ok) {
            newsData = {
              critical: payload?.critical ?? [],
              daily: payload?.daily ?? [],
              other: payload?.other ?? [],
            };
          } else {
            console.error('Failed to fetch news:', payload?.error);
          }
        } catch (error) {
          console.error('Failed to fetch news:', error);
        }
      }

      if (selectedCategoryId === 'home') {
        try {
          const response = await fetch('/api/ai/market-overview/latest');
          const payload = await response.json();
          if (response.ok) {
            homeInsightData = payload?.data ?? null;
          } else {
            console.error('Failed to fetch latest market overview:', payload?.error);
          }
        } catch (error) {
          console.error('Failed to fetch latest market overview:', error);
        }

        const divergenceSymbols = [
          'SPY',
          'RSP_SPY_RATIO',
          'BAMLH0A0HYM2',
          'STLFSI4',
          'T10YIE',
          'STICKCPIM158SFRBATL',
          'MEDCPIM158SFRBCLE',
          'GLD',
          'DFII10',
          'FED_SPEAK_SENTIMENT_MOMENTUM',
          'NFCI',
          'DBA',
          'US_DROUGHT_MONITOR',
          'STOCKS_TO_USE_RATIO',
          'BTCUSD',
          'TOTAL3',
          'NET_LIQUIDITY',
        ];

        const { data: divergenceMetrics } = await supabase
          .from('metrics')
          .select('id, symbol, name')
          .in('symbol', divergenceSymbols);

        if (divergenceMetrics && divergenceMetrics.length > 0) {
          const metricIdToMeta = new Map(
            divergenceMetrics.map((metric) => [
              metric.id,
              { symbol: metric.symbol, name: metric.name },
            ]),
          );

          const { data: divergenceRows } = await supabase
            .from('metric_values')
            .select('metric_id, value, date')
            .in('metric_id', divergenceMetrics.map((metric) => metric.id))
            .order('date', { ascending: false });

          const symbolToValues = new Map<string, number[]>();

          for (const row of divergenceRows ?? []) {
            const meta = metricIdToMeta.get(row.metric_id);
            if (!meta) continue;

            const existing = symbolToValues.get(meta.symbol) ?? [];
            if (existing.length >= 2) continue;

            existing.push(Number(row.value));
            symbolToValues.set(meta.symbol, existing);
          }

          const divergenceMap = new Map<string, DivergenceMetricValue>();
          divergenceMetrics.forEach((metric) => {
            const values = symbolToValues.get(metric.symbol) ?? [];
            divergenceMap.set(metric.symbol, {
              symbol: metric.symbol,
              name: metric.name,
              latest: values[0] ?? null,
              previous: values[1] ?? null,
            });
          });

          divergences = buildDivergences(divergenceMap);
        }
      } else {
        const { data: fetchedMetrics } = await supabase.from('metrics').select('*').eq('category_id', selectedCategoryId);
        metrics = fetchedMetrics;
        
        // 4. Seçili Kategori için AI Insight Çek
        const { data: fetchedInsight } = await supabase
          .from('ai_insights')
          .select('summary')
          .eq('category_id', selectedCategoryId)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        insightData = fetchedInsight;
      }

      // 5. Aktif Uyarıları Çek
      const { data: alertsData } = await supabase
        .from('alerts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      const metricList: DashboardData['pilotMetrics'] = [];
      let latestUpdateStr: string | null = totalScoreData ? totalScoreData.created_at : null;
      const parsedInsight = parseAiInsight(insightData ? insightData.summary : null);
      const parsedHomeInsight = parseAiInsight(homeInsightData ? homeInsightData.summary : null);

      if (metrics) {
        const typedMetrics = metrics as Array<{
          id: string;
          name: string;
          symbol: string;
          source: string;
          description: string | null;
          is_inverse: boolean | null;
        }>;

        const metricValueResults = await mapWithConcurrency(typedMetrics, 8, async (metric) => {
          const { data: rows } = await supabase
            .from('metric_values')
            .select('metric_id, value, date, created_at')
            .eq('metric_id', metric.id)
            .order('date', { ascending: false })
            .limit(30);

          return {
            metricId: metric.id,
            rows: (rows ?? []).map((row) => ({
              value: Number(row.value),
              date: row.date,
              created_at: row.created_at,
            })),
          };
        });

        const valuesByMetricId = new Map<string, Array<{ value: number; date: string; created_at: string }>>(
          metricValueResults.map((entry) => [entry.metricId, entry.rows]),
        );

        for (const m of typedMetrics) {
          const values = valuesByMetricId.get(m.id) ?? [];
          let val = null;
          let latestDate: string | null = null;
          let change = null;
          let changePct = null;
          let trend: 'up' | 'down' | 'flat' = 'flat';
          let history: { date: string; value: number }[] = [];
          const cadence = getMetricCadence(m.source);

          if (values.length > 0) {
            val = values[0].value;
            latestDate = values[0].date;
            if (!latestUpdateStr || new Date(values[0].created_at) > new Date(latestUpdateStr)) {
              latestUpdateStr = values[0].created_at;
            }
            if (values.length > 1) {
              const prevVal = values[1].value;
              change = val - prevVal;
              changePct = (change / prevVal) * 100;
              trend = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
            }
            
            // Recharts için veriyi eskiden yeniye sırala
            history = values.map(v => ({
              date: v.date,
              value: v.value
            })).reverse();
          }

          metricList.push({
            id: m.id,
            name: m.name,
            symbol: m.symbol,
            source: m.source,
            description: m.description ?? null,
            isInverse: Boolean(m.is_inverse),
            latestDate,
            cadence,
            value: val,
            change,
            changePct,
            trend,
            history
          });
        }
      }

      const latestTotalScore = totalScoreData ? Number(totalScoreData.score) : null;
      const referenceTotalScore = totalScoreHistory ? findSevenDayReference(
        totalScoreHistory.map((entry) => ({
          score: Number(entry.score),
          date: entry.date,
        })),
      ) : null;
      const totalScoreChange7d =
        latestTotalScore !== null && referenceTotalScore !== null
          ? latestTotalScore - referenceTotalScore
          : null;

      if (requestId !== requestIdRef.current) {
        return;
      }

      setData({
        totalScore: latestTotalScore,
        totalScoreChange7d,
        totalScoreTrend: getScoreTrend(latestTotalScore, referenceTotalScore),
        lastUpdate: latestUpdateStr,
        homeInsight: parsedHomeInsight.expertSummary,
        homeSimpleSummary: parsedHomeInsight.simpleSummary,
        homeConfidence: parsedHomeInsight.confidence,
        aiInsight: parsedInsight.expertSummary,
        aiSimpleSummary: parsedInsight.simpleSummary,
        aiConfidence: parsedInsight.confidence,
        fedProfiles: selectedCategoryId === FED_POWER_CATEGORY_ID ? fedGovernorProfiles : [],
        categories: categoryList,
        pilotMetrics: metricList,
        alerts: alertsData || [],
        news: newsData,
        divergences,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategoryId]);

  return { data, loading, refetch: fetchData };
}

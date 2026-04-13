import { useState, useEffect } from 'react';
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
}

function getMetricCadence(source: string): 'daily' | 'annual' {
  if ([
    'VDEM',
    'WORLD_HAPPINESS',
    'WID',
    'EDELMAN',
    'CORNELL_ILR',
    'ELECTION_DATA',
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

export function useDashboardData(selectedCategoryId: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
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

      const metricList = [];
      let latestUpdateStr: string | null = totalScoreData ? totalScoreData.created_at : null;
      const parsedInsight = parseAiInsight(insightData ? insightData.summary : null);
      const parsedHomeInsight = parseAiInsight(homeInsightData ? homeInsightData.summary : null);

      if (metrics) {
        for (const m of metrics) {
          // Metriğin son 30 değerini çek (Değişim hesaplamak ve grafik için)
          const { data: values } = await supabase
            .from('metric_values')
            .select('value, date, created_at')
            .eq('metric_id', m.id)
            .order('date', { ascending: false })
            .limit(30);

          let val = null;
          let latestDate: string | null = null;
          let change = null;
          let changePct = null;
          let trend: 'up' | 'down' | 'flat' = 'flat';
          let history: { date: string; value: number }[] = [];
          const cadence = getMetricCadence(m.source);

          if (values && values.length > 0) {
            val = Number(values[0].value);
            latestDate = values[0].date;
            if (!latestUpdateStr || new Date(values[0].created_at) > new Date(latestUpdateStr)) {
              latestUpdateStr = values[0].created_at;
            }
            if (values.length > 1) {
              const prevVal = Number(values[1].value);
              change = val - prevVal;
              changePct = (change / prevVal) * 100;
              trend = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
            }
            
            // Recharts için veriyi eskiden yeniye sırala
            history = values.map(v => ({
              date: v.date,
              value: Number(v.value)
            })).reverse();
          }

          metricList.push({
            id: m.id,
            name: m.name,
            symbol: m.symbol,
            source: m.source,
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
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategoryId]);

  return { data, loading, refetch: fetchData };
}

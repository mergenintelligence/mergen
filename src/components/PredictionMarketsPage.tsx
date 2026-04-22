import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Minus, Layers3, Radar, Scale, BarChart3, ShieldAlert, TrendingUp, DollarSign, Globe, Landmark, Bitcoin, Wheat, Star } from 'lucide-react';
import type { DashboardData } from '../hooks/useDashboardData';
import { AiInsightCard } from './AiInsightCard';

type Metric = DashboardData['pilotMetrics'][number];

// ─── Ton haritası ─────────────────────────────────────────────────────────────

function getSectionTone(accent: string) {
  const map: Record<string, { border: string; bg: string; softBg: string; glow: string; icon: string }> = {
    '#7DD3FC': { border: 'border-[#1A3140]', bg: 'bg-[#0B1216]', softBg: 'bg-[#0E171C]', glow: '0 0 0 1px rgba(125,211,252,0.04) inset', icon: 'text-[#7DD3FC]' },
    '#4ADE80': { border: 'border-[#173325]', bg: 'bg-[#0B120F]', softBg: 'bg-[#0E1713]', glow: '0 0 0 1px rgba(74,222,128,0.04) inset', icon: 'text-[#4ADE80]' },
    '#F87171': { border: 'border-[#3F1818]', bg: 'bg-[#140B0B]', softBg: 'bg-[#1A0F0F]', glow: '0 0 0 1px rgba(248,113,113,0.04) inset', icon: 'text-[#F87171]' },
    '#FBBF24': { border: 'border-[#3B3116]', bg: 'bg-[#141108]', softBg: 'bg-[#1A150A]', glow: '0 0 0 1px rgba(251,191,36,0.04) inset', icon: 'text-[#FBBF24]' },
    '#67E8F9': { border: 'border-[#18313C]', bg: 'bg-[#0A1216]', softBg: 'bg-[#0D181D]', glow: '0 0 0 1px rgba(103,232,249,0.04) inset', icon: 'text-[#67E8F9]' },
    '#A78BFA': { border: 'border-[#2A1F40]', bg: 'bg-[#0E0B16]', softBg: 'bg-[#120F1C]', glow: '0 0 0 1px rgba(167,139,250,0.04) inset', icon: 'text-[#A78BFA]' },
  };
  return map[accent] ?? { border: 'border-[#2A2A2A]', bg: 'bg-[#111111]', softBg: 'bg-[#0D0D0D]', glow: '0 0 0 1px rgba(163,163,163,0.04) inset', icon: 'text-[#A3A3A3]' };
}

// ─── Bölüm tanımları ──────────────────────────────────────────────────────────

const SECTIONS = [
  {
    key: 'monetary',
    title: 'Parasal Politika & Fed',
    subtitle: 'Faiz patikası, pivot beklentisi ve enflasyon fiyatlaması.',
    icon: <Landmark className="w-4 h-4" />,
    accent: '#67E8F9',
    symbols: [
      'PM_FED_CUT_PROB',
      'PM_RATE_HIKE_PROB',
      'PM_POWELL_DOVISH_PIVOT_PROB',
      'PM_FED_PAUSE_EXTENSION_PROB',
      'PM_YEAR_END_FED_PATH',
      'PM_US_INFLATION_UPSURPRISE_PROB',
      'PM_STAGFLATION_PROB',
      'PM_INFLATION_TARGET_BREACH_PROB',
    ],
  },
  {
    key: 'growth',
    title: 'Büyüme & Resesyon',
    subtitle: 'ABD, AB, Çin ve EM büyüme dinamiklerinde beklenti rejimi.',
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    accent: '#4ADE80',
    symbols: [
      'PM_US_RECESSION_PROB',
      'PM_SOFT_LANDING_PROB',
      'PM_EU_RECESSION_PROB',
      'PM_CHINA_HARD_LANDING_PROB',
      'PM_EM_CONTAGION_PROB',
      'PM_OECD_GROWTH_DOWNGRADE_PROB',
    ],
  },
  {
    key: 'geopolitical',
    title: 'Küresel Risk & Jeopolitik',
    subtitle: 'Çatışma, tarife, kriz ve kredi fiyatlaması.',
    icon: <Globe className="w-3.5 h-3.5" />,
    accent: '#F87171',
    symbols: [
      'PM_WAR_ESCALATION_PROB',
      'PM_TRADE_WAR_ESCALATION_PROB',
      'PM_TARIFF_SHOCK_PROB',
      'PM_OIL_SHOCK_PROB',
      'PM_DEBT_CEILING_CRISIS_PROB',
      'PM_CREDIT_SPREAD_WIDENING_PROB',
    ],
  },
  {
    key: 'assets',
    title: 'Varlık Sınıfı Beklentileri',
    subtitle: 'Kripto, altın, enerji, dolar ve hisse senedi fiyatlaması.',
    icon: <DollarSign className="w-3.5 h-3.5" />,
    accent: '#FBBF24',
    symbols: [
      'PM_BTC_ABOVE_100K_PROB',
      'PM_GOLD_ABOVE_3000_PROB',
      'PM_OIL_ABOVE_100_PROB',
      'PM_DOLLAR_STRENGTH_PROB',
      'PM_CRYPTO_REGULATION_STRICT_PROB',
      'PM_EQUITY_CORRECTION_PROB',
    ],
  },
  {
    key: 'structure',
    title: 'Piyasa Yapısı & Konsensüs',
    subtitle: 'Hacim, derinlik, konsensüs kalitesi ve güven göstergeleri.',
    icon: <Scale className="w-3.5 h-3.5" />,
    accent: '#A78BFA',
    symbols: [
      'PM_CONSENSUS_STRENGTH',
      'PM_UNCERTAINTY_DENSITY',
      'PM_MARKET_CONFIDENCE_SCORE',
      'PM_ACTIVE_MARKET_COUNT',
      'PM_MACRO_MARKET_COUNT',
      'PM_TOTAL_OPEN_INTEREST',
      'PM_VOLUME_24H',
      'PM_VOLUME_7D',
      'PM_AVG_BID_ASK_SPREAD',
      'PM_AVG_MARKET_DEPTH',
    ],
  },
  {
    key: 'scores',
    title: 'Rejim Skorları',
    subtitle: 'Beklenti piyasası rejimine dair toplulaştırılmış ve türetilmiş göstergeler.',
    icon: <BarChart3 className="w-3.5 h-3.5" />,
    accent: '#FBBF24',
    symbols: [
      'PM_GENERAL_SCORE',
      'PM_MACRO_RISK_SCORE',
      'PM_RECESSION_PRICING_SCORE',
      'PM_INFLATION_PRICING_SCORE',
      'PM_REGIME_COHERENCE_SCORE',
      'PM_SURPRISE_RISK_SCORE',
      'PM_VS_BONDS_DIVERGENCE',
      'PM_VS_GOLD_DIVERGENCE',
    ],
  },
] as const;

// Spotlight'ta önceliklendirilecek kritik metrik havuzu
const SPOTLIGHT_SYMBOLS = [
  'PM_FED_CUT_PROB',
  'PM_US_RECESSION_PROB',
  'PM_WAR_ESCALATION_PROB',
  'PM_GENERAL_SCORE',
  'PM_RATE_HIKE_PROB',
  'PM_SOFT_LANDING_PROB',
  'PM_MARKET_CONFIDENCE_SCORE',
  'PM_MACRO_RISK_SCORE',
  'PM_INFLATION_PRICING_SCORE',
  'PM_CREDIT_SPREAD_WIDENING_PROB',
];

// ─── Yardımcı fonksiyonlar ────────────────────────────────────────────────────

function isProbMetric(m: Metric) {
  return m.symbol.includes('_PROB');
}

function isScoreMetric(m: Metric) {
  return m.symbol.includes('_SCORE') || m.symbol.includes('_DIVERGENCE') || m.symbol.includes('_PATH');
}

function getProbTone(value: number, isInverse: boolean) {
  if (isInverse) {
    if (value >= 65) return { label: 'Kritik', color: '#F87171' };
    if (value >= 45) return { label: 'Yüksek Risk', color: '#FB923C' };
    if (value >= 25) return { label: 'Orta Risk', color: '#FBBF24' };
    return { label: 'Düşük Risk', color: '#4ADE80' };
  }
  if (value >= 65) return { label: 'Güçlü', color: '#4ADE80' };
  if (value >= 45) return { label: 'Yüksek İhtimal', color: '#86EFAC' };
  if (value >= 30) return { label: 'Belirsiz', color: '#FBBF24' };
  return { label: 'Düşük İhtimal', color: '#F87171' };
}

function getScoreTone(score: number, isInverse: boolean) {
  const eff = isInverse ? 100 - score : score;
  if (eff >= 65) return { label: 'Destekleyici', color: '#4ADE80' };
  if (eff >= 40) return { label: 'Karışık', color: '#FBBF24' };
  return { label: isInverse ? 'Stresli' : 'Zayıf', color: '#F87171' };
}

function trendColor(m: Metric) {
  if (!m.change) return '#666666';
  return m.change > 0 ? '#4ADE80' : '#F87171';
}

function ChangePill({ metric }: { metric: Metric }) {
  if (metric.changePct === null) return null;
  const color = trendColor(metric);
  return (
    <div
      className="flex items-center gap-0.5 text-[11px] font-mono px-1.5 py-0.5 rounded-sm shrink-0"
      style={{ color, backgroundColor: `${color}18` }}
    >
      {(metric.change ?? 0) > 0 && <ArrowUp className="w-3 h-3" />}
      {(metric.change ?? 0) < 0 && <ArrowDown className="w-3 h-3" />}
      {(metric.change ?? 0) === 0 && <Minus className="w-3 h-3" />}
      {Math.abs(metric.changePct).toFixed(2)}%
    </div>
  );
}

function PredictionMetricsHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className="premium-accent-panel relative mb-4 rounded-sm border px-4 py-3 overflow-hidden"
      style={{
        borderColor: '#2A2A2A',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.16) 0%, rgba(24,24,24,0.52) 24%, rgba(15,15,18,0.96) 58%, rgba(15,15,18,1) 100%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
        boxShadow: '0 0 0 1px rgba(245,158,11,0.08) inset, 0 16px 34px rgba(245,158,11,0.08)',
      }}
    >
      <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 50%, #FDE68A 100%)' }} />
      <div className="absolute -left-10 top-0 h-24 w-24 rounded-full blur-2xl pointer-events-none bg-[#F59E0B]/[0.08]" />
      <div className="absolute right-6 top-3 h-14 w-14 rounded-full blur-2xl pointer-events-none bg-[#FBBF24]/[0.10]" />
      <div className="relative">
        <div
          className="mb-2 inline-flex items-center rounded-sm border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] font-semibold"
          style={{
            color: '#FBBF24',
            borderColor: 'rgba(251,191,36,0.25)',
            backgroundColor: 'rgba(251,191,36,0.12)',
            boxShadow: 'inset 0 0 0 1px rgba(251,191,36,0.08), 0 0 18px rgba(245,158,11,0.06)',
          }}
        >
          Veri Bölümü
        </div>
        <div className="text-sm font-medium text-[#F5F5F5]">{title}</div>
        <div className="mt-1 text-xs text-[#B0B0B0] leading-relaxed">{description}</div>
      </div>
    </div>
  );
}

// ─── Kart bileşenleri ─────────────────────────────────────────────────────────

/** Olasılık metriği kartı */
function ProbCard({ metric, accent, showMetricDates, isFavorite, onToggleFavorite }: { key?: React.Key; metric: Metric; accent: string; showMetricDates: boolean; isFavorite: boolean; onToggleFavorite: () => void }) {
  const val = metric.value ?? 0;
  const hasVal = metric.value !== null;
  const inv = metric.isInverse ?? false;
  const tone = getProbTone(val, inv);

  return (
    <div className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4 flex flex-col gap-3 min-h-[148px]">
      {/* Başlık */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-[#E5E5E5] uppercase tracking-wider leading-snug">
            {metric.name}
          </div>
          <div className="text-[10px] text-[#666666] mt-1 leading-relaxed">{metric.description}</div>
        </div>
        <div className="flex items-start gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleFavorite}
            className={`rounded-sm border p-1 transition-colors ${isFavorite ? 'border-[#4B3A12] bg-[#1A160B] text-[#FBBF24]' : 'border-[#1F1F1F] bg-[#0D0D0D] text-[#666666] hover:text-[#FBBF24]'}`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-[#FBBF24]' : ''}`} />
          </button>
          <ChangePill metric={metric} />
        </div>
      </div>

      {/* Değer + etiket */}
      <div className="mt-auto">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-mono tabular-nums font-bold" style={{ color: hasVal ? tone.color : '#444' }}>
            {hasVal ? `${val.toFixed(1)}%` : '--'}
          </span>
          {hasVal && (
            <span className="text-[10px] uppercase tracking-wider" style={{ color: `${tone.color}BB` }}>
              {tone.label}
            </span>
          )}
        </div>
        {/* Bar */}
        <div className="h-1 rounded-full bg-[#1E1E1E] overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${hasVal ? val : 0}%`, backgroundColor: tone.color, opacity: 0.7 }}
          />
        </div>
        {showMetricDates && metric.latestDate && (
          <div className="text-[10px] text-[#444] font-mono mt-2">{metric.latestDate}</div>
        )}
      </div>
    </div>
  );
}

/** Skor metriği kartı */
function ScoreCard({ metric, accent, showMetricDates, isFavorite, onToggleFavorite }: { key?: React.Key; metric: Metric; accent: string; showMetricDates: boolean; isFavorite: boolean; onToggleFavorite: () => void }) {
  const val = metric.value ?? 0;
  const hasVal = metric.value !== null;
  const inv = metric.isInverse ?? false;
  const norm = Math.max(0, Math.min(100, val));
  const tone = getScoreTone(norm, inv);

  return (
    <div className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4 flex flex-col gap-3 min-h-[148px]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-[#E5E5E5] uppercase tracking-wider leading-snug">
            {metric.name}
          </div>
          <div className="text-[10px] text-[#666666] mt-1 leading-relaxed">{metric.description}</div>
        </div>
        <div className="flex items-start gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleFavorite}
            className={`rounded-sm border p-1 transition-colors ${isFavorite ? 'border-[#4B3A12] bg-[#1A160B] text-[#FBBF24]' : 'border-[#1F1F1F] bg-[#0D0D0D] text-[#666666] hover:text-[#FBBF24]'}`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-[#FBBF24]' : ''}`} />
          </button>
          <ChangePill metric={metric} />
        </div>
      </div>

      <div className="mt-auto">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-mono tabular-nums font-bold text-[#E5E5E5]">
            {hasVal ? Math.round(val) : '--'}
            {hasVal && <span className="text-sm text-[#555]">/100</span>}
          </span>
          {hasVal && (
            <span className="text-[10px] uppercase tracking-wider" style={{ color: `${tone.color}BB` }}>
              {tone.label}
            </span>
          )}
        </div>
        <div className="h-1 rounded-full bg-[#1E1E1E] overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${norm}%`, background: `linear-gradient(90deg, ${tone.color}66, ${tone.color})` }}
          />
        </div>
        {showMetricDates && metric.latestDate && (
          <div className="text-[10px] text-[#444] font-mono mt-2">{metric.latestDate}</div>
        )}
      </div>
    </div>
  );
}

/** Sayısal stat kartı (hacim, sayı, derinlik vb.) */
function StatCard({ metric, showMetricDates, isFavorite, onToggleFavorite }: { key?: React.Key; metric: Metric; showMetricDates: boolean; isFavorite: boolean; onToggleFavorite: () => void }) {
  const hasVal = metric.value !== null;
  const color = trendColor(metric);

  function formatVal(m: Metric) {
    if (!hasVal) return '--';
    const v = m.value!;
    if (m.symbol.includes('MARKET_COUNT')) return `${Math.round(v)} adet`;
    if (m.symbol.includes('AVG_BID_ASK_SPREAD')) return `${v.toFixed(2)}¢`;
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
    return v.toFixed(2);
  }

  return (
    <div className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4 flex flex-col gap-3 min-h-[148px]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-[#E5E5E5] uppercase tracking-wider leading-snug">
            {metric.name}
          </div>
          <div className="text-[10px] text-[#666666] mt-1 leading-relaxed">{metric.description}</div>
        </div>
        <div className="flex items-start gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleFavorite}
            className={`rounded-sm border p-1 transition-colors ${isFavorite ? 'border-[#4B3A12] bg-[#1A160B] text-[#FBBF24]' : 'border-[#1F1F1F] bg-[#0D0D0D] text-[#666666] hover:text-[#FBBF24]'}`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-[#FBBF24]' : ''}`} />
          </button>
          <ChangePill metric={metric} />
        </div>
      </div>

      <div className="mt-auto">
        <div className="text-2xl font-mono tabular-nums text-[#E5E5E5] mb-1">
          {formatVal(metric)}
        </div>
        <div className="text-[10px] text-[#555]">
          {metric.isInverse ? 'Daha düşük daha sağlıklı' : 'Daha yüksek daha güçlü aktivite'}
        </div>
        {showMetricDates && metric.latestDate && (
          <div className="text-[10px] text-[#444] font-mono mt-1">{metric.latestDate}</div>
        )}
      </div>
    </div>
  );
}

function getMetricMeaning(metric: Metric) {
  const base = metric.description?.trim() || `${metric.name}, beklenti piyasası rejimini okutan yardımcı bir göstergedir.`;
  const lowerName = `${metric.name} ${metric.description ?? ''}`.toLowerCase();

  let lowText = metric.isInverse
    ? 'Düşük kalması genelde daha sakin, kontrollü bir rejime işaret eder.'
    : 'Düşük kalması ilgi veya güvenin zayıf olduğunu düşündürür.';
  let highText = metric.isInverse
    ? 'Yüksek seyretmesi stres veya risk fiyatlamasının öne çıktığını düşündürür.'
    : 'Yüksek seyretmesi daha güçlü konsensüs veya destekleyici rejime işaret eder.';

  if (lowerName.includes('olasılığı') || lowerName.includes('prob')) {
    lowText = metric.isInverse
      ? 'Düşük olması, bu risk başlığının piyasada daha sınırlı fiyatlandığını düşündürür.'
      : 'Düşük olması, bu senaryoya piyasanın daha az ihtimal verdiğini düşündürür.';
    highText = metric.isInverse
      ? 'Yüksek olması, bu risk başlığının daha yoğun fiyatlandığını düşündürür.'
      : 'Yüksek olması, bu senaryoya prediction market tarafında daha yüksek olasılık verildiğini düşündürür.';
  } else if (lowerName.includes('hacim') || lowerName.includes('open interest') || lowerName.includes('açık pozisyon')) {
    lowText = 'Düşük olması, katılımın ve piyasa derinliğinin zayıf kaldığını düşündürür.';
    highText = 'Yüksek olması, katılımın, likiditenin veya olay etrafındaki piyasa ilgisinin güçlendiğini düşündürür.';
  }

  return {
    base,
    lowText,
    highText,
  };
}

// ─── Ana bileşen ──────────────────────────────────────────────────────────────

type SummaryCard = { key: string; label: string; title: string; note: string; tone: string };

interface PredictionMarketsPageProps {
  pilotMetrics: Metric[];
  aiInsight: string | null;
  aiSimpleSummary: string | null;
  aiConfidence: number | null;
  guideDefaultOpen: boolean;
  showMetricDates: boolean;
  showLegalNote: boolean;
  watchlist: { symbol: string }[];
  onToggleFavorite: (metric: Metric) => void;
  summaryCards?: SummaryCard[];
}

export function PredictionMarketsPage({
  pilotMetrics,
  aiInsight,
  aiSimpleSummary,
  aiConfidence,
  guideDefaultOpen,
  showMetricDates,
  showLegalNote,
  watchlist,
  onToggleFavorite,
  summaryCards = [],
}: PredictionMarketsPageProps) {
  const [isGuideOpen, setIsGuideOpen] = useState(guideDefaultOpen);
  useEffect(() => { setIsGuideOpen(guideDefaultOpen); }, [guideDefaultOpen]);

  const bySymbol = new Map(pilotMetrics.map((m) => [m.symbol, m]));
  const fetchedCount = pilotMetrics.filter((m) => m.value !== null).length;
  const coverageRatio = pilotMetrics.length > 0 ? Math.round((fetchedCount / pilotMetrics.length) * 100) : 0;
  const lastUpdate =
    pilotMetrics.map((m) => m.latestUpdatedAt ?? m.latestDate).filter((v): v is string => Boolean(v))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
  const aiReliability = aiConfidence !== null
    ? Math.max(1, Math.min(5, Math.round(aiConfidence)))
    : coverageRatio >= 85 ? 4 : coverageRatio >= 65 ? 3 : coverageRatio >= 40 ? 2 : 1;

  const spotlightPrimary = SPOTLIGHT_SYMBOLS
    .map((s) => bySymbol.get(s))
    .filter((metric): metric is Metric => Boolean(metric && metric.value !== null));

  const spotlightFallback = pilotMetrics.filter(
    (metric) =>
      metric.value !== null
      && (isProbMetric(metric) || isScoreMetric(metric))
      && !spotlightPrimary.some((selected) => selected.symbol === metric.symbol),
  );

  const spotlightMetrics = [...spotlightPrimary, ...spotlightFallback].slice(0, 4);

  return (
    <div className="space-y-6">

      {/* ── AI Yorumu ─────────────────────────────────────────────────────── */}
      <AiInsightCard
        title="Polymarket / Kalshi Tahmin Piyasaları - Mergen Intelligent Yorumu"
        insight={aiInsight}
        simpleSummary={aiSimpleSummary}
        confidence={aiReliability}
        emptyText="Bu kategori için henüz AI yorumu oluşmadı. Gemini kotası doluysa kart boş kalabilir. Daha sonra tekrar deneyiniz."
      />

      {/* ── Meta strip ────────────────────────────────────────────────────── */}
      <PredictionMetricsHeader
        title="Polymarket / Kalshi Tahmin Piyasaları Metrikleri"
        description="Kategoriye ait ana metrikleri, kapsama düzeyini ve alt kırılımları bu bölümde birlikte okuyabilirsin."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-[#666666] mb-1">Veri kapsaması</div>
          <div className="text-sm text-[#E5E5E5] font-mono tabular-nums">%{coverageRatio}</div>
          <div className="text-xs text-[#666666] mt-1">{fetchedCount}/{pilotMetrics.length} metrik dolu</div>
        </div>
        <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-[#666666] mb-1">AI güven</div>
          <div className="text-sm text-[#E5E5E5] font-mono tabular-nums">{aiReliability}/5</div>
          <div className="text-xs text-[#666666] mt-1">Fiyatlanan anlatı ile veri yoğunluğu birlikte okunmalı</div>
        </div>
        <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-[#666666] mb-1">Son güncelleme</div>
          <div className="text-sm text-[#E5E5E5] font-mono tabular-nums">
            {lastUpdate ? new Date(lastUpdate).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '--'}
          </div>
          <div className="text-xs text-[#666666] mt-1">Beklenti tarafındaki en güncel veri zamanı</div>
        </div>
      </div>

      {/* ── Sinyal Özet Kartları ── */}
      {summaryCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {summaryCards.map((item) => (
            <div key={item.key} className={`rounded-sm border px-4 py-3 ${item.tone}`}>
              <div className="text-[10px] uppercase tracking-wider opacity-80 mb-2">{item.label}</div>
              <div className="text-sm font-medium text-[#F5F5F5] leading-snug">{item.title}</div>
              <div className="mt-2 text-xs text-[#A3A3A3] leading-relaxed">{item.note}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Spotlight ─────────────────────────────────────────────────────── */}
      {spotlightMetrics.length > 0 && (
        <div>
          <div
            className="premium-accent-panel relative mb-4 rounded-sm border px-4 py-3 border-[#3B3116] bg-[#141108]"
            style={{
              backgroundImage: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)',
              boxShadow: '0 0 0 1px rgba(251,191,36,0.04) inset',
            }}
          >
            <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-sm bg-[#FBBF24]" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] text-[#A3A3A3] uppercase tracking-wider">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-sm border border-[#3B3116] bg-[#1A150A] text-[#FBBF24]"
                    style={{ boxShadow: 'inset 0 0 18px rgba(251,191,36,0.12)' }}
                  >
                    <Radar className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[#D4D4D4]">Kritik Sinyaller</span>
                </div>
                <div className="text-xs text-[#8A8A8A] mt-1 leading-relaxed">
                  Prediction market tarafında ilk bakışta izlenmesi gereken öne çıkan metrikler.
                </div>
              </div>
              <div
                className="shrink-0 rounded-sm border px-2 py-1 text-[10px] uppercase tracking-wider text-[#A3A3A3] border-[#3B3116] bg-[#1A150A]"
                style={{ boxShadow: 'inset 0 0 14px rgba(251,191,36,0.10)' }}
              >
                {spotlightMetrics.length} metrik
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {spotlightMetrics.map((m) => (
              isProbMetric(m) ? (
                <ProbCard
                  key={m.id}
                  metric={m}
                  accent="#FBBF24"
                  showMetricDates={showMetricDates}
                  isFavorite={watchlist.some((w) => w.symbol === m.symbol)}
                  onToggleFavorite={() => onToggleFavorite(m)}
                />
              ) : isScoreMetric(m) ? (
                <ScoreCard
                  key={m.id}
                  metric={m}
                  accent="#FBBF24"
                  showMetricDates={showMetricDates}
                  isFavorite={watchlist.some((w) => w.symbol === m.symbol)}
                  onToggleFavorite={() => onToggleFavorite(m)}
                />
              ) : (
                <StatCard
                  key={m.id}
                  metric={m}
                  showMetricDates={showMetricDates}
                  isFavorite={watchlist.some((w) => w.symbol === m.symbol)}
                  onToggleFavorite={() => onToggleFavorite(m)}
                />
              )
            ))}
          </div>
        </div>
      )}

      {/* ── Bölümler ──────────────────────────────────────────────────────── */}
      {SECTIONS.map((section) => {
        const metrics = section.symbols
          .map((s) => bySymbol.get(s))
          .filter((metric): metric is Metric => Boolean(metric && metric.value !== null));
        if (metrics.length === 0) return null;

        const tone = getSectionTone(section.accent);
        return (
          <div key={section.key}>
            <div
              className={`premium-accent-panel relative mb-4 rounded-sm border px-4 py-3 ${tone.border} ${tone.bg}`}
              style={{
                backgroundImage: `linear-gradient(135deg, ${section.accent}14 0%, transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)`,
                boxShadow: tone.glow,
              }}
            >
              <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-sm" style={{ backgroundColor: section.accent }} />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] text-[#A3A3A3] uppercase tracking-wider">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-sm border ${tone.border} ${tone.softBg} ${tone.icon}`}
                      style={{ boxShadow: `inset 0 0 18px ${section.accent}12` }}
                    >
                      {section.icon}
                    </span>
                    <span className="text-[#D4D4D4]">{section.title}</span>
                  </div>
                  <div className="text-xs text-[#8A8A8A] mt-1 leading-relaxed">{section.subtitle}</div>
                </div>
                <div
                  className={`shrink-0 rounded-sm border px-2 py-1 text-[10px] uppercase tracking-wider text-[#A3A3A3] ${tone.border} ${tone.softBg}`}
                  style={{ boxShadow: `inset 0 0 14px ${section.accent}10` }}
                >
                  {metrics.length} metrik
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {metrics.map((m) => {
                const isFav = watchlist.some((w) => w.symbol === m.symbol);
                const onToggle = () => onToggleFavorite(m);
                if (isProbMetric(m)) {
                  return <ProbCard key={m.id} metric={m} accent={section.accent} showMetricDates={showMetricDates} isFavorite={isFav} onToggleFavorite={onToggle} />;
                }
                if (isScoreMetric(m)) {
                  return <ScoreCard key={m.id} metric={m} accent={section.accent} showMetricDates={showMetricDates} isFavorite={isFav} onToggleFavorite={onToggle} />;
                }
                return <StatCard key={m.id} metric={m} showMetricDates={showMetricDates} isFavorite={isFav} onToggleFavorite={onToggle} />;
              })}
            </div>
          </div>
        );
      })}

      {/* ── Metrik Rehberi ────────────────────────────────────────────────── */}
      {pilotMetrics.length > 0 && (
        <div className="mt-10">
          <button
            type="button"
            onClick={() => setIsGuideOpen((v) => !v)}
            className="mb-4 w-full rounded-sm border border-[#1F1F1F] bg-[#111111] px-4 py-3 text-left hover:bg-[#141414] transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[11px] text-[#A3A3A3] uppercase tracking-wider">
                  <Layers3 className="w-4 h-4" />
                  <span>Metrik Rehberi</span>
                </div>
                <div className="text-[11px] text-[#666666] mt-2 leading-relaxed">
                  Her metriğin neyi ölçtüğünü, düşük ve yüksek okumanın hangi rejime işaret ettiğini açıklar.
                </div>
              </div>
              <div className="shrink-0 rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] px-3 py-2 text-[10px] uppercase tracking-wider text-[#A3A3A3]">
                {isGuideOpen ? 'Gizle' : 'Aç'}
              </div>
            </div>
          </button>

          {isGuideOpen && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pilotMetrics.map((metric) => {
                const meaning = getMetricMeaning(metric);
                const lowTone = metric.isInverse ? 'border-[#16351F] bg-[#0D120D]' : 'border-[#3C3113] bg-[#120F0A]';
                const highTone = metric.isInverse ? 'border-[#3F1818] bg-[#140B0B]' : 'border-[#16351F] bg-[#0D120D]';
                return (
                  <div key={`${metric.id}-guide`} className="rounded-sm border border-[#1F1F1F] bg-[#111111] p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="text-[13px] font-medium text-[#E5E5E5]">{metric.name}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-wider text-[#666666]">{metric.symbol}</div>
                      </div>
                      <div className="shrink-0 rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] px-2 py-1 text-[10px] uppercase tracking-wider text-[#666666]">
                        {metric.isInverse ? 'ters ölçek' : 'doğru ölçek'}
                      </div>
                    </div>
                    <div className="mt-3 mb-1 text-[10px] uppercase tracking-wider text-[#666666]">Bu metrik neyi anlatır?</div>
                    <div className="text-[12px] text-[#A3A3A3] leading-relaxed">{meaning.base}</div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className={`rounded-sm border p-2.5 ${lowTone}`}>
                        <div className="text-[10px] uppercase tracking-wider text-[#666666] mb-1">Düşük olduğunda</div>
                        <div className="text-[12px] text-[#D4D4D4] leading-relaxed">{meaning.lowText}</div>
                      </div>
                      <div className={`rounded-sm border p-2.5 ${highTone}`}>
                        <div className="text-[10px] uppercase tracking-wider text-[#666666] mb-1">Yüksek olduğunda</div>
                        <div className="text-[12px] text-[#D4D4D4] leading-relaxed">{meaning.highText}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Yasal not ─────────────────────────────────────────────────────── */}
      {showLegalNote && (
        <div className="mt-10 pt-6 border-t border-[#1F1F1F]">
          <div className="text-xs text-[#666666] leading-relaxed max-w-4xl">
            MERGEN INTELLIGENCE, prediction market fiyatlamalarını makro rejim okumalarıyla birlikte izlemek için tasarlanmış bir analiz panelidir. Buradaki skorlar, olasılıklar ve açıklamalar yalnızca bilgi amaçlıdır; yatırım tavsiyesi veya finansal danışmanlık yerine geçmez.
          </div>
        </div>
      )}
    </div>
  );
}

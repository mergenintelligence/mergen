import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Minus, Layers3 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import type { DashboardData } from '../hooks/useDashboardData';

const COIN_META: Record<string, { label: string; color: string; symbol: string }> = {
  BTCUSD: { label: 'Bitcoin', color: '#F7931A', symbol: 'BTC' },
  ETH:    { label: 'Ethereum', color: '#627EEA', symbol: 'ETH' },
  BNB:    { label: 'BNB', color: '#F3BA2F', symbol: 'BNB' },
  XRP:    { label: 'XRP', color: '#00AAE4', symbol: 'XRP' },
};

const MARKET_META: Record<string, { label: string; description: string }> = {
  COIN: { label: 'Coinbase (COIN)', description: 'Kurumsal kripto adaptasyonu barometresi' },
  MSTR: { label: 'MicroStrategy (MSTR)', description: 'Kaldıraçlı BTC exposure amplifikatörü' },
  CRCL: { label: 'Circle (CRCL)', description: 'Stablecoin altyapısı ve regüle kripto finansı barometresi' },
};

const STRUCTURE_META: Record<string, { label: string; description: string }> = {
  'BTC.D': { label: 'BTC Dominance', description: 'Piyasanın ne kadarının Bitcoin merkezli toplandığını gösterir.' },
  'USDT.D': { label: 'Stablecoin Dominance', description: 'Likiditenin riskli coinlerden nakde/stablecoinlere kaçışını izler.' },
  TOTAL: { label: 'TOTAL', description: 'Toplam kripto piyasa değeri; genel risk iştahının geniş göstergesi.' },
  TOTAL2: { label: 'TOTAL2', description: 'BTC hariç toplam piyasa değeri; altcoin genişliğini okur.' },
  TOTAL3: { label: 'TOTAL3', description: 'BTC ve ETH hariç geniş altcoin risk iştahını ölçer.' },
};

const DERIVATIVES_META: Record<string, { label: string; description: string }> = {
  OPEN_INTEREST: { label: 'Open Interest', description: 'Vadeli işlemlerde açık pozisyon büyüklüğü; kaldıraç birikimini gösterir.' },
  FUNDING_RATES: { label: 'Funding Rates', description: 'Long-short dengesini ve aşırı tek taraflı kalabalığı izler.' },
  LIQUIDATION_HEATMAP: { label: 'Liquidation Heatmap', description: 'Yoğun tasfiye bölgelerini ve sıkışma riskini gösterir.' },
};

const STABLECOIN_META: Record<string, { label: string; description: string }> = {
  TOTAL_STABLECOIN_MCAP: { label: 'Total Stablecoin Market Cap', description: 'Kripto sisteme park etmiş toplam dolar-benzeri likiditeyi gösterir.' },
  NET_STABLECOIN_FLOW: { label: 'Net Stablecoin Exchange Flow', description: 'Borsalara giren veya çıkan stablecoin likiditesini izler.' },
  USDT_PRINTING: { label: 'USDT Printing', description: 'Yeni Tether arzı ile sisteme eklenen taze likiditeyi temsil eder.' },
};

const SENTIMENT_META: Record<string, { label: string; description: string }> = {
  GOOGLE_TRENDS_BTC: { label: 'Google Trends: Bitcoin', description: 'Bireysel ilginin ve anlatı sıcaklığının arama verisi karşılığıdır.' },
};

const ONCHAIN_META: Record<string, { label: string; description: string }> = {
  BTC_REALIZED_CAP: { label: 'Bitcoin Realized Cap', description: 'Zincir üstü maliyet bazlı sermaye birikiminin sağlamlığını gösterir.' },
  L2_TVL_GROWTH_RATE: { label: 'Layer 2 TVL Büyüme Hızı', description: 'Katman-2 ekosistemindeki sermaye yayılımını ve kullanım ivmesini izler.' },
  ACTIVE_WALLETS_VOLUME_RATIO: { label: 'Aktif Cüzdan / Hacim Oranı', description: 'İşlem hacminin geniş katılım mı yoksa dar spekülasyon mu taşıdığını okumaya yardım eder.' },
  MINER_REVENUE_HASHRATE_RATIO: { label: 'Madenci Geliri / Hashrate', description: 'Madencilik ekonomisinin ağ gücüne göre verimliliğini temsil eder.' },
};

const MACRO_CORRELATIONS = [
  {
    title: 'BTC ↔ DXY',
    signal: 'Ters Korelasyon',
    color: '#F87171',
    description:
      'Dolar Endeksi (DXY) güçlenirken Bitcoin genellikle baskı altına girer. Güçlü dolar küresel risk iştahını kısar.',
  },
  {
    title: 'BTC ↔ NASDAQ',
    signal: 'Pozitif Korelasyon',
    color: '#4ADE80',
    description:
      'Bitcoin ile teknoloji hisseleri (QQQ) yüksek korelasyon gösterir. Risk iştahı açıldığında her ikisi de yükselir.',
  },
  {
    title: 'BTC ↔ Küresel M2',
    signal: 'Gecikmeli Pozitif',
    color: '#FBBF24',
    description:
      'Küresel para arzı genişlediğinde Bitcoin gecikmeli olarak tepki verir. M2 artışı → kripto likidite artışı.',
  },
];

interface FearGreedEntry {
  value: string | number;
  value_classification: string;
  timestamp: string;
}

interface CryptoPageProps {
  pilotMetrics: DashboardData['pilotMetrics'];
  aiInsight: string | null;
  aiSimpleSummary: string | null;
  aiConfidence: number | null;
  guideDefaultOpen: boolean;
  showMetricDates: boolean;
  showLegalNote: boolean;
}

function getMetricMeaning(metric: DashboardData['pilotMetrics'][number]) {
  const base = metric.description?.trim() || `${metric.name}, kripto rejimini okumaya yardım eden yardımcı bir göstergedir.`;
  const isInverse = metric.symbol === 'USDT.D'
    || metric.symbol === 'OPEN_INTEREST'
    || metric.symbol === 'FUNDING_RATES'
    || metric.symbol === 'LIQUIDATION_HEATMAP';

  return {
    base,
    lowText: isInverse
      ? 'Düşük kalması genelde daha sakin kaldıraç, daha dengeli positioning veya daha düşük savunma modu anlamına gelir.'
      : 'Düşük kalması genelde ilginin zayıfladığını, breadth daraldığını veya likiditenin güç kaybettiğini düşündürür.',
    highText: isInverse
      ? 'Yüksek seyretmesi genelde sıkışan positioning, artan kaldıraç ya da savunmacı davranışın öne çıktığını düşündürür.'
      : 'Yüksek seyretmesi genelde güçlenen risk iştahı, artan likidite veya anlatının sıcak kaldığı bir rejime işaret eder.',
  };
}

function formatCryptoPrice(value: number | null, symbol: string): string {
  if (value === null) return '--';
  if (symbol === 'XRP' || symbol === 'BNB') {
    return `$${value.toFixed(symbol === 'XRP' ? 4 : 2)}`;
  }
  if (value >= 1000) {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `$${value.toFixed(2)}`;
}

function trendColor(trend: string) {
  if (trend === 'up') return '#4ADE80';
  if (trend === 'down') return '#F87171';
  return '#666666';
}

function formatGenericValue(symbol: string, value: number | null) {
  if (value === null) return '--';

  if (['BTC.D', 'USDT.D', 'FUNDING_RATES', 'DFII10', 'DGS10'].includes(symbol)) {
    return `${value.toFixed(2)}%`;
  }

  if (symbol === 'NET_STABLECOIN_FLOW') {
    return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  }

  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  }

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  return value.toFixed(2);
}

// ─── Fear & Greed gauge ────────────────────────────────────────────────────────

function fgColor(v: number) {
  if (v <= 25) return '#F87171';
  if (v <= 45) return '#FB923C';
  if (v <= 55) return '#FBBF24';
  if (v <= 75) return '#A3E635';
  return '#4ADE80';
}

function FearGreedGauge({
  value,
  classification,
  history,
}: {
  value: number;
  classification: string;
  history: FearGreedEntry[];
}) {
  const color = fgColor(value);

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-4xl font-mono tabular-nums font-bold" style={{ color }}>
          {value}
        </span>
        <span className="text-sm text-[#666666]">/ 100</span>
      </div>
      <div className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color }}>
        {classification}
      </div>

      {/* Gradient progress bar */}
      <div
        className="relative h-3 rounded-full overflow-hidden mb-1"
        style={{ background: 'linear-gradient(to right, #F87171, #FB923C, #FBBF24, #A3E635, #4ADE80)' }}
      >
        <div
          className="absolute top-0 w-3 h-3 rounded-full bg-white border-2 border-[#0A0A0A]"
          style={{ left: `calc(${value}% - 6px)` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-[#666666] uppercase tracking-wider mb-5">
        <span>Aşırı Korku</span>
        <span>Nötr</span>
        <span>Açgözlülük</span>
      </div>

      {/* 7-day bar history */}
      {history.length > 0 && (
        <div>
          <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-2">7 Günlük Seyir</div>
          <div className="flex items-end gap-1.5">
            {[...history].slice(0, 7).reverse().map((h, i) => {
              const v = Number(h.value);
              const c = fgColor(v);
              const barH = Math.max(10, (v / 100) * 44);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-[2px]"
                    style={{ height: `${barH}px`, backgroundColor: c, opacity: 0.75 }}
                  />
                  <div className="text-[9px] font-mono text-[#666666]">{v}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Price card ───────────────────────────────────────────────────────────────

function PriceCard({ metric, showMetricDates }: { metric: DashboardData['pilotMetrics'][0]; showMetricDates: boolean }) {
  const meta = COIN_META[metric.symbol];
  if (!meta) return null;
  const tc = trendColor(metric.trend);

  return (
    <div className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-sm flex items-center justify-center text-[11px] font-bold shrink-0"
            style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
          >
            {meta.symbol[0]}
          </div>
          <div>
            <div className="text-xs font-semibold text-[#E5E5E5] uppercase tracking-wider leading-none">
              {meta.symbol}
            </div>
            <div className="text-[10px] text-[#666666] mt-0.5">{meta.label}</div>
          </div>
        </div>
        {metric.changePct !== null && (
          <div
            className="flex items-center gap-0.5 text-xs font-mono px-1.5 py-0.5 rounded-sm"
            style={{ color: tc, backgroundColor: `${tc}18` }}
          >
            {metric.trend === 'up' && <ArrowUp className="w-3 h-3" />}
            {metric.trend === 'down' && <ArrowDown className="w-3 h-3" />}
            {metric.trend === 'flat' && <Minus className="w-3 h-3" />}
            {Math.abs(metric.changePct).toFixed(2)}%
          </div>
        )}
      </div>

      {/* Price */}
      <div className="text-2xl font-mono tabular-nums font-bold text-[#E5E5E5]">
        {formatCryptoPrice(metric.value, metric.symbol)}
      </div>

      {/* Sparkline */}
      {metric.history.length > 1 && (
        <div className="h-14 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metric.history}>
              <YAxis domain={['dataMin', 'dataMax']} hide />
              <Line type="monotone" dataKey="value" stroke={tc} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Date */}
      <div className="text-[10px] text-[#666666] font-mono">
        {showMetricDates
          ? metric.latestDate
            ? new Date(metric.latestDate).toLocaleDateString('tr-TR')
            : 'Veri yok'
          : 'Tarih gizli'}
      </div>
    </div>
  );
}

// ─── Market barometer card ────────────────────────────────────────────────────

function BarometerCard({ metric }: { metric: DashboardData['pilotMetrics'][0] }) {
  const meta = MARKET_META[metric.symbol];
  if (!meta) return null;
  const tc = trendColor(metric.trend);

  return (
    <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-sm p-3">
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <div className="text-xs font-semibold text-[#E5E5E5] uppercase tracking-wider">
            {metric.symbol}
          </div>
          <div className="text-[10px] text-[#666666]">{meta.label}</div>
        </div>
        {metric.changePct !== null && (
          <span className="text-xs font-mono" style={{ color: tc }}>
            {metric.trend === 'up' ? '+' : ''}{metric.changePct.toFixed(2)}%
          </span>
        )}
      </div>
      <div className="text-xl font-mono tabular-nums text-[#E5E5E5] mb-1">
        {metric.value !== null ? `$${metric.value.toFixed(2)}` : '--'}
      </div>
      <div className="text-[10px] text-[#666666]">{meta.description}</div>
    </div>
  );
}

function SignalCard({
  title,
  description,
  metric,
  showMetricDates,
}: {
  title: string;
  description: string;
  metric?: DashboardData['pilotMetrics'][0];
  showMetricDates: boolean;
}) {
  const tc = metric ? trendColor(metric.trend) : '#666666';

  return (
    <div className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4 min-h-[132px] flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="text-xs font-semibold text-[#E5E5E5] uppercase tracking-wider">
            {title}
          </div>
          <div className="text-[10px] text-[#666666] mt-1 leading-relaxed">
            {description}
          </div>
        </div>
        {metric?.changePct !== null && metric?.changePct !== undefined ? (
          <div
            className="text-[11px] font-mono px-1.5 py-0.5 rounded-sm shrink-0"
            style={{ color: tc, backgroundColor: `${tc}18` }}
          >
            {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : ''}
            {Math.abs(metric.changePct).toFixed(2)}%
          </div>
        ) : null}
      </div>

      <div className="mt-auto">
        {metric ? (
          <>
            <div className="text-2xl font-mono tabular-nums text-[#E5E5E5] mb-2">
              {formatGenericValue(metric.symbol, metric.value)}
            </div>
            <div className="text-[10px] text-[#666666] font-mono">
              {showMetricDates
                ? metric.latestDate
                  ? new Date(metric.latestDate).toLocaleDateString('tr-TR')
                  : 'Veri yok'
                : 'Tarih gizli'}
            </div>
          </>
        ) : (
          <>
            <div className="text-sm text-[#666666] font-mono mb-2">Yakında eklenecek</div>
            <div className="text-[10px] text-[#4F4F4F]">Veri hattı hazırlandığında bu blok otomatik dolacak.</div>
          </>
        )}
      </div>
    </div>
  );
}

function SectionBlock({
  title,
  subtitle,
  items,
  showMetricDates,
}: {
  title: string;
  subtitle: string;
  items: Array<{ key: string; label: string; description: string; metric?: DashboardData['pilotMetrics'][0] }>;
  showMetricDates: boolean;
}) {
  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-3">
        <div>
          <div className="text-[11px] text-[#A3A3A3] uppercase tracking-wider mb-1">{title}</div>
          <div className="text-xs text-[#666666] leading-relaxed">{subtitle}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.key}>
            <SignalCard
              title={item.label}
              description={item.description}
              metric={item.metric}
              showMetricDates={showMetricDates}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CryptoPage({
  pilotMetrics,
  aiInsight,
  aiSimpleSummary,
  aiConfidence,
  guideDefaultOpen,
  showMetricDates,
  showLegalNote,
}: CryptoPageProps) {
  const [fearGreedData, setFearGreedData] = useState<{
    value: number;
    classification: string;
    history: FearGreedEntry[];
  } | null>(null);
  const [fgLoading, setFgLoading] = useState(true);
  const [isGuideOpen, setIsGuideOpen] = useState(guideDefaultOpen);

  useEffect(() => {
    setIsGuideOpen(guideDefaultOpen);
  }, [guideDefaultOpen]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/crypto/fear-greed');
        const json = await res.json();
        if (json?.data?.length > 0) {
          setFearGreedData({
            value: Number(json.data[0].value),
            classification: json.data[0].value_classification,
            history: json.data,
          });
        }
      } catch {
        // silent — Fear & Greed is supplementary
      } finally {
        setFgLoading(false);
      }
    })();
  }, []);

  const priceMetrics   = pilotMetrics.filter((m) => COIN_META[m.symbol]);
  const marketMetrics  = pilotMetrics.filter((m) => MARKET_META[m.symbol]);
  const metricMap = new Map(pilotMetrics.map((metric) => [metric.symbol, metric]));
  const structureItems = Object.entries(STRUCTURE_META).map(([key, meta]) => ({
    key,
    label: meta.label,
    description: meta.description,
    metric: metricMap.get(key),
  }));
  const derivativesItems = Object.entries(DERIVATIVES_META).map(([key, meta]) => ({
    key,
    label: meta.label,
    description: meta.description,
    metric: metricMap.get(key),
  }));
  const stablecoinItems = Object.entries(STABLECOIN_META).map(([key, meta]) => ({
    key,
    label: meta.label,
    description: meta.description,
    metric: metricMap.get(key),
  }));
  const onchainItems = Object.entries(ONCHAIN_META).map(([key, meta]) => ({
    key,
    label: meta.label,
    description: meta.description,
    metric: metricMap.get(key),
  }));
  const sentimentItems = Object.entries(SENTIMENT_META).map(([key, meta]) => ({
    key,
    label: meta.label,
    description: meta.description,
    metric: metricMap.get(key),
  }));
  const confidenceClamp = aiConfidence !== null ? Math.max(0, Math.min(5, aiConfidence)) : null;
  const fetchedMetrics = pilotMetrics.filter((metric) => metric.value !== null).length;
  const coverageRatio = pilotMetrics.length > 0 ? Math.round((fetchedMetrics / pilotMetrics.length) * 100) : 0;
  const lastUpdate = pilotMetrics
    .map((metric) => metric.latestDate)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
  const aiReliability = confidenceClamp ?? (coverageRatio >= 85 ? 4 : coverageRatio >= 65 ? 3 : coverageRatio >= 40 ? 2 : 1);
  const guideMetrics = [
    ...priceMetrics,
    ...marketMetrics,
    ...structureItems.map((item) => item.metric).filter(Boolean),
    ...derivativesItems.map((item) => item.metric).filter(Boolean),
    ...stablecoinItems.map((item) => item.metric).filter(Boolean),
    ...onchainItems.map((item) => item.metric).filter(Boolean),
    ...sentimentItems.map((item) => item.metric).filter(Boolean),
  ] as DashboardData['pilotMetrics'];

  return (
    <div className="space-y-6">

      {/* ── Section 1: AI Yorum ── */}
      <div className="bg-[#111111] border border-[#1F1F1F] p-4 rounded-sm">
        <div className="flex items-start gap-3 mb-3">
          <div
            className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
              aiInsight ? 'bg-[#4ADE80] animate-pulse' : 'bg-[#666666]'
            }`}
          />
          <div className="text-sm font-semibold text-[#E5E5E5] tracking-wide">
            MERGEN AI — Kripto Para Piyasaları Analizi
          </div>
          {confidenceClamp !== null && (
            <div className="ml-auto flex items-center gap-3 border border-[#1F1F1F] bg-[#0D0D0D] px-3 py-2 rounded-sm">
              <div className="text-sm font-semibold text-[#E5E5E5] whitespace-nowrap">
                Güven {confidenceClamp}/5
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2.5 w-5 rounded-[2px] border ${
                      i < confidenceClamp
                        ? 'border-[#4ADE80] bg-[#4ADE80]'
                        : 'border-[#2A2A2A] bg-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        {aiInsight ? (
          <>
            <div className="text-sm text-[#E5E5E5] leading-relaxed">{aiInsight}</div>
            {aiSimpleSummary && (
              <div className="mt-4 pt-4 border-t border-[#1F1F1F]">
                <div className="text-[10px] text-[#A3A3A3] uppercase tracking-wider mb-2">
                  Sade Özet
                </div>
                <div className="text-sm text-[#D4D4D4] leading-relaxed">{aiSimpleSummary}</div>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-[#666666] leading-relaxed">
            Bu kategori için henüz AI yorumu oluşmadı. Sağ üstteki{' '}
            <span className="text-[#A3A3A3]">AI Prompt</span> butonuyla üretilebilir.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-[#666666] mb-1">Veri kapsaması</div>
          <div className="text-sm text-[#E5E5E5] font-mono tabular-nums">%{coverageRatio}</div>
          <div className="text-xs text-[#666666] mt-1">{fetchedMetrics}/{pilotMetrics.length} metrik dolu</div>
        </div>
        <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-[#666666] mb-1">AI güven</div>
          <div className="text-sm text-[#E5E5E5] font-mono tabular-nums">{aiReliability}/5</div>
          <div className="text-xs text-[#666666] mt-1">Veri yoğunluğu ve anlatı güveni birlikte okunmalı</div>
        </div>
        <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-[#666666] mb-1">Son güncelleme</div>
          <div className="text-sm text-[#E5E5E5] font-mono tabular-nums">
            {lastUpdate ? new Date(lastUpdate).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '--'}
          </div>
          <div className="text-xs text-[#666666] mt-1">Kategori içindeki en güncel veri zamanı</div>
        </div>
      </div>

      {/* ── Section 2: Ana Kripto Varlıkları ── */}
      <div>
        <div className="text-[11px] text-[#A3A3A3] uppercase tracking-wider mb-3">
          Ana Kripto Varlıkları
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {priceMetrics.map((m) => (
            <div key={m.id}>
              <PriceCard metric={m} showMetricDates={showMetricDates} />
            </div>
          ))}
          {priceMetrics.length === 0 && (
            <div className="col-span-full text-sm text-[#666666] font-mono py-8 text-center border border-dashed border-[#1F1F1F]">
              Kripto fiyat verisi henüz çekilmedi. Kategoriyi Çalıştır butonunu kullanın.
            </div>
          )}
        </div>
      </div>

      {/* ── Section 3: Duyarlılık + Kurumsal Barometreler ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Fear & Greed */}
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4">
          <div className="text-[11px] text-[#A3A3A3] uppercase tracking-wider mb-4">
            Duyarlılık ve Perakende İlgi
          </div>
        <div className="grid grid-cols-1 gap-4 mb-4">
          {sentimentItems.map((item) => (
            <div key={item.key}>
              <SignalCard
                title={item.label}
                description={item.description}
                metric={item.metric}
                showMetricDates={showMetricDates}
              />
            </div>
          ))}
        </div>
          {fgLoading ? (
            <div className="text-sm text-[#666666] font-mono">Yükleniyor…</div>
          ) : fearGreedData ? (
            <FearGreedGauge
              value={fearGreedData.value}
              classification={fearGreedData.classification}
              history={fearGreedData.history}
            />
          ) : (
            <div className="text-sm text-[#666666] font-mono">
              Fear &amp; Greed verisi alınamadı.
            </div>
          )}
        </div>

        {/* Market barometers */}
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4">
          <div className="text-[11px] text-[#A3A3A3] uppercase tracking-wider mb-4">
            Kurumsal ve Şirket Barometreleri
          </div>
          <div className="space-y-3">
            {marketMetrics.map((m) => (
              <div key={m.id}>
                <BarometerCard metric={m} />
              </div>
            ))}
            {marketMetrics.length === 0 && (
              <div className="text-sm text-[#666666] font-mono">Veri yok.</div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-[#1F1F1F]">
            <div className="text-[10px] text-[#666666] leading-relaxed">
              <span className="text-[#A3A3A3] font-medium">COIN</span> kurumsal kripto
              adaptasyonunun en likit borsası barometresidir.{' '}
              <span className="text-[#A3A3A3] font-medium">MSTR</span> kaldıraçlı BTC
              pozisyonu nedeniyle volatilite amplifikatörü gibi davranır.
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 4: Piyasa Yapısı ve Breadth ── */}
      <SectionBlock
        title="Piyasa Yapısı ve Breadth"
        subtitle="Piyasanın Bitcoin merkezli mi, altcoin odaklı mı, yoksa savunmacı stablecoin tarafına mı kaydığını anlamak için."
        items={structureItems}
        showMetricDates={showMetricDates}
      />

      {/* ── Section 5: Türev Piyasalar ve Kaldıraç ── */}
      <SectionBlock
        title="Türev Piyasalar ve Kaldıraç"
        subtitle="Aşırı kaldıraç, tek taraflı kalabalık ve olası tasfiye sıkışmalarını okumak için."
        items={derivativesItems}
        showMetricDates={showMetricDates}
      />

      {/* ── Section 6: Stablecoin Likiditesi ── */}
      <SectionBlock
        title="Stablecoin Likiditesi"
        subtitle="Sisteme giren taze dolar-benzeri likiditeyi ve borsalara akış yönünü izlemek için."
        items={stablecoinItems}
        showMetricDates={showMetricDates}
      />

      <SectionBlock
        title="On-Chain Yapısal Sağlık"
        subtitle="Ağ içi benimsenme, sermaye kalitesi ve madencilik ekonomisi."
        items={onchainItems}
        showMetricDates={showMetricDates}
      />

      {/* ── Section 7: Makro Korelasyon Çerçevesi ── */}
      <div>
        <div className="text-[11px] text-[#A3A3A3] uppercase tracking-wider mb-3">
          Makro Korelasyon Çerçevesi
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MACRO_CORRELATIONS.map((corr) => (
            <div key={corr.title} className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-mono font-semibold text-[#E5E5E5]">
                  {corr.title}
                </div>
                <div
                  className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
                  style={{ color: corr.color, backgroundColor: `${corr.color}18` }}
                >
                  {corr.signal}
                </div>
              </div>
              <div className="text-xs text-[#A3A3A3] leading-relaxed">{corr.description}</div>
            </div>
          ))}
        </div>
      </div>

      {guideMetrics.length > 0 && (
        <div className="mt-10">
          <button
            type="button"
            onClick={() => setIsGuideOpen((current) => !current)}
            className="mb-4 w-full rounded-sm border border-[#1F1F1F] bg-[#111111] px-4 py-3 text-left hover:bg-[#141414] transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[11px] text-[#A3A3A3] uppercase tracking-wider">
                  <Layers3 className="w-4 h-4" />
                  <span>Metrik Rehberi</span>
                </div>
                <div className="text-[11px] text-[#666666] mt-2 leading-relaxed">
                  Bu bölüm, kripto metriklerinin neyi anlattığını ve yüksek ya da düşük okunmasının genel olarak hangi rejime işaret ettiğini hızlı okumak için hazırlandı.
                </div>
              </div>
              <div className="shrink-0 rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] px-3 py-2 text-[10px] uppercase tracking-wider text-[#A3A3A3]">
                {isGuideOpen ? 'Gizle' : 'Aç'}
              </div>
            </div>
          </button>
          {isGuideOpen && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {guideMetrics.map((metric) => {
                const meaning = getMetricMeaning(metric);
                const isInverse = ['USDT.D', 'OPEN_INTEREST', 'FUNDING_RATES', 'LIQUIDATION_HEATMAP'].includes(metric.symbol);
                const lowTone = isInverse ? 'border-[#16351F] bg-[#0D120D]' : 'border-[#3C3113] bg-[#120F0A]';
                const highTone = isInverse ? 'border-[#3F1818] bg-[#140B0B]' : 'border-[#16351F] bg-[#0D120D]';
                return (
                  <div key={`${metric.id}-guide`} className="rounded-sm border border-[#1F1F1F] bg-[#111111] p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="text-[13px] font-medium text-[#E5E5E5]">{metric.name}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-wider text-[#666666]">{metric.symbol}</div>
                      </div>
                      <div className="shrink-0 rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] px-2 py-1 text-[10px] uppercase tracking-wider text-[#666666]">
                        aktif
                      </div>
                    </div>
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

      {showLegalNote && (
        <div className="mt-10 pt-6 border-t border-[#1F1F1F]">
          <div className="text-xs text-[#666666] leading-relaxed max-w-4xl">
            MERGEN INTELLIGENCE, kripto piyasalarını makro, likidite ve positioning çerçevesiyle izlemek için tasarlanmış bir analiz panelidir. Buradaki skorlar, yorumlar ve metrik açıklamaları yalnızca bilgi amaçlıdır; yatırım tavsiyesi veya finansal danışmanlık yerine geçmez.
          </div>
        </div>
      )}

    </div>
  );
}

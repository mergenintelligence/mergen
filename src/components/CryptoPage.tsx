import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Minus, Layers3, Star } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import type { DashboardData } from '../hooks/useDashboardData';

const COIN_META: Record<string, { label: string; color: string; symbol: string }> = {
  BTCUSD: { label: 'Bitcoin', color: '#F7931A', symbol: 'BTC' },
  ETH:    { label: 'Ethereum', color: '#627EEA', symbol: 'ETH' },
  BNB:    { label: 'BNB', color: '#F3BA2F', symbol: 'BNB' },
  XRP:    { label: 'XRP', color: '#00AAE4', symbol: 'XRP' },
  SOL:    { label: 'Solana', color: '#14F195', symbol: 'SOL' },
  TRX:    { label: 'TRON', color: '#FF060A', symbol: 'TRX' },
  DOGE:   { label: 'Dogecoin', color: '#C2A633', symbol: 'DOGE' },
  HYPE:   { label: 'HYPE', color: '#7C3AED', symbol: 'HYPE' },
};

const MARKET_META: Record<string, { label: string; description: string }> = {
  COIN: { label: 'Coinbase (COIN)', description: 'Kurumsal kripto adaptasyonu barometresi' },
  MSTR: { label: 'MicroStrategy (MSTR)', description: 'Kaldıraçlı BTC exposure amplifikatörü' },
  CRCL: { label: 'Circle (CRCL)', description: 'Stablecoin altyapısı ve regüle kripto finansı barometresi' },
};

const CRYPTO_HEATMAP_WEIGHTS: Record<string, number> = {
  BTCUSD: 36,
  ETH: 28,
  SOL: 14,
  XRP: 8,
  BNB: 7,
  TRX: 4,
  DOGE: 4,
  HYPE: 3,
};

const CRYPTO_HEATMAP_LAYOUT: Record<string, string> = {
  BTCUSD: 'col-span-7 row-span-4',
  ETH: 'col-span-5 row-span-3',
  SOL: 'col-span-3 row-span-2',
  XRP: 'col-span-2 row-span-2',
  BNB: 'col-span-2 row-span-1',
  TRX: 'col-span-2 row-span-1',
  DOGE: 'col-span-1 row-span-1',
  HYPE: 'col-span-2 row-span-1',
};

type CryptoHeatmapMode = 'weight' | 'change' | 'momentum' | 'price';

const CRYPTO_HEATMAP_MODES: Array<{ id: CryptoHeatmapMode; label: string }> = [
  { id: 'weight', label: 'Ağırlık' },
  { id: 'change', label: 'Chg%' },
  { id: 'momentum', label: 'Momentum' },
  { id: 'price', label: 'Fiyat' },
];

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
  SOCIAL_DOMINANCE_SCORE: { label: 'Social dominance / social mentions', description: 'Sosyal ağlardaki görünürlük, konuşulma yoğunluğu ve anlatının topluluk tarafındaki yayılımını ölçer.' },
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

type SummaryCard = { key: string; label: string; title: string; note: string; tone: string };

interface CryptoPageProps {
  pilotMetrics: DashboardData['pilotMetrics'];
  aiInsight: string | null;
  aiSimpleSummary: string | null;
  aiConfidence: number | null;
  guideDefaultOpen: boolean;
  showMetricDates: boolean;
  showLegalNote: boolean;
  watchlist: { symbol: string }[];
  onToggleFavorite: (metric: DashboardData['pilotMetrics'][number]) => void;
  summaryCards?: SummaryCard[];
}

function getCryptoSectionTone(title: string) {
  const lower = title.toLowerCase();

  if (lower.includes('ısı haritası') || lower.includes('isi haritasi') || lower.includes('isı haritası') || lower.includes('heatmap')) {
    return {
      border: 'border-[#2B4C72]',
      bg: 'bg-[#0B1520]',
      accent: '#60A5FA',
      shadow: '0 0 0 1px rgba(96,165,250,0.10) inset, 0 16px 34px rgba(37,99,235,0.10)',
    };
  }

  if (lower.includes('ana kripto')) {
    return {
      border: 'border-[#3B3116]',
      bg: 'bg-[#141108]',
      accent: '#FBBF24',
      shadow: '0 0 0 1px rgba(251,191,36,0.05) inset, 0 14px 30px rgba(251,191,36,0.05)',
    };
  }

  if (lower.includes('duyarlılık') || lower.includes('perakende')) {
    return {
      border: 'border-[#173325]',
      bg: 'bg-[#0B120F]',
      accent: '#4ADE80',
      shadow: '0 0 0 1px rgba(74,222,128,0.05) inset, 0 14px 30px rgba(74,222,128,0.05)',
    };
  }

  if (lower.includes('kurumsal') || lower.includes('şirket')) {
    return {
      border: 'border-[#31233E]',
      bg: 'bg-[#120D18]',
      accent: '#C084FC',
      shadow: '0 0 0 1px rgba(192,132,252,0.05) inset, 0 14px 30px rgba(192,132,252,0.05)',
    };
  }

  if (lower.includes('lider') || lower.includes('ana varlık')) {
    return {
      border: 'border-[#3A2D12]',
      bg: 'bg-[#141008]',
      accent: '#FBBF24',
      shadow: '0 0 0 1px rgba(251,191,36,0.05) inset, 0 14px 30px rgba(251,191,36,0.05)',
    };
  }

  if (lower.includes('breadth') || lower.includes('yapı')) {
    return {
      border: 'border-[#18313C]',
      bg: 'bg-[#0A1216]',
      accent: '#67E8F9',
      shadow: '0 0 0 1px rgba(103,232,249,0.05) inset, 0 14px 30px rgba(103,232,249,0.05)',
    };
  }

  if (lower.includes('türev') || lower.includes('kaldıraç')) {
    return {
      border: 'border-[#3C3113]',
      bg: 'bg-[#141008]',
      accent: '#FBBF24',
      shadow: '0 0 0 1px rgba(251,191,36,0.05) inset, 0 14px 30px rgba(251,191,36,0.05)',
    };
  }

  if (lower.includes('stablecoin') || lower.includes('likidite')) {
    return {
      border: 'border-[#1E341C]',
      bg: 'bg-[#0C120B]',
      accent: '#86EFAC',
      shadow: '0 0 0 1px rgba(134,239,172,0.05) inset, 0 14px 30px rgba(134,239,172,0.05)',
    };
  }

  if (lower.includes('on-chain')) {
    return {
      border: 'border-[#2B233E]',
      bg: 'bg-[#100D18]',
      accent: '#A78BFA',
      shadow: '0 0 0 1px rgba(167,139,250,0.05) inset, 0 14px 30px rgba(167,139,250,0.05)',
    };
  }

  if (lower.includes('makro korelasyon')) {
    return {
      border: 'border-[#3C2A16]',
      bg: 'bg-[#151009]',
      accent: '#F59E0B',
      shadow: '0 0 0 1px rgba(245,158,11,0.05) inset, 0 14px 30px rgba(245,158,11,0.05)',
    };
  }

  return {
    border: 'border-[#2A2A2A]',
    bg: 'bg-[#111111]',
    accent: '#A3A3A3',
    shadow: '0 0 0 1px rgba(163,163,163,0.04) inset',
  };
}

function getHeatmapSummaryTone(kind: 'leader' | 'positive' | 'negative') {
  if (kind === 'leader') {
    return {
      border: 'border-[#3A2D12]',
      bg: 'bg-[#151008]',
      accent: '#FBBF24',
      label: 'text-[#D6B76A]',
      value: 'text-[#F8E7B0]',
    };
  }

  if (kind === 'positive') {
    return {
      border: 'border-[#183722]',
      bg: 'bg-[#0B1510]',
      accent: '#4ADE80',
      label: 'text-[#8EE6AB]',
      value: 'text-[#BBF7D0]',
    };
  }

  return {
    border: 'border-[#3B1C1C]',
    bg: 'bg-[#170D0D]',
    accent: '#F87171',
    label: 'text-[#F2A4A4]',
    value: 'text-[#FECACA]',
  };
}

function CryptoSectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const tone = getCryptoSectionTone(title);
  const lowerTitle = title.toLowerCase();
  const isHeatmap =
    lowerTitle.includes('ısı haritası')
    || lowerTitle.includes('isi haritasi')
    || lowerTitle.includes('isı haritası')
    || lowerTitle.includes('heatmap');
  const accentRgb = tone.accent === '#60A5FA'
    ? '96,165,250'
    : tone.accent === '#FBBF24'
      ? '251,191,36'
      : tone.accent === '#4ADE80'
        ? '74,222,128'
        : tone.accent === '#C084FC'
          ? '192,132,252'
          : tone.accent === '#67E8F9'
            ? '103,232,249'
            : tone.accent === '#86EFAC'
              ? '134,239,172'
              : tone.accent === '#A78BFA'
                ? '167,139,250'
                : tone.accent === '#F59E0B'
                  ? '245,158,11'
                  : '163,163,163';
  const headerStyle = {
    borderColor: isHeatmap ? '#2F5D92' : undefined,
    backgroundColor: undefined,
    backgroundImage: `linear-gradient(135deg, rgba(${accentRgb}, ${isHeatmap ? '0.22' : '0.16'}) 0%, rgba(24,24,24,0.52) 24%, rgba(15,15,18,0.96) 58%, rgba(15,15,18,1) 100%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)`,
    boxShadow: `0 0 0 1px rgba(${accentRgb}, ${isHeatmap ? '0.12' : '0.08'}) inset, 0 16px 34px rgba(${accentRgb}, ${isHeatmap ? '0.10' : '0.07'})`,
  } as const;

  return (
    <div
      className={`relative mb-4 overflow-hidden rounded-sm border px-4 py-3 ${tone.border} ${tone.bg}`}
      style={headerStyle}
    >
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: isHeatmap ? 'linear-gradient(90deg, #1D4ED8 0%, #60A5FA 40%, #93C5FD 100%)' : tone.accent }}
      />
      {isHeatmap && (
        <>
          <div className="absolute -left-10 top-0 h-24 w-24 rounded-full bg-[#60A5FA]/[0.08] blur-2xl pointer-events-none" />
          <div className="absolute right-6 top-3 h-14 w-14 rounded-full bg-[#1D4ED8]/[0.10] blur-2xl pointer-events-none" />
        </>
      )}
      {!isHeatmap && (
        <>
          <div
            className="absolute -left-10 top-0 h-24 w-24 rounded-full blur-2xl pointer-events-none"
            style={{ backgroundColor: `rgba(${accentRgb},0.07)` }}
          />
          <div
            className="absolute right-6 top-3 h-14 w-14 rounded-full blur-2xl pointer-events-none"
            style={{ backgroundColor: `rgba(${accentRgb},0.08)` }}
          />
        </>
      )}
      <div>
        <div
          className="mb-2 inline-flex items-center rounded-sm border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] font-semibold"
          style={{
            color: tone.accent,
            borderColor: isHeatmap ? '#60A5FA55' : `${tone.accent}40`,
            backgroundColor: isHeatmap ? 'rgba(96,165,250,0.16)' : `rgba(${accentRgb},0.16)`,
            boxShadow: `inset 0 0 0 1px rgba(${accentRgb},0.10), 0 0 18px rgba(${accentRgb},${isHeatmap ? '0.08' : '0.06'})`,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div className="text-xs leading-relaxed" style={{ color: isHeatmap ? '#B6CAE3' : '#A9A9A9' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

function CryptoMetricsHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className="relative mb-4 rounded-sm border px-4 py-3 overflow-hidden"
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

function getMetricMeaning(metric: DashboardData['pilotMetrics'][number]) {
  const symbol = metric.symbol.toUpperCase();
  const base = metric.description?.trim() || `${metric.name}, kripto rejimini okumaya yardım eden yardımcı bir göstergedir.`;
  const isInverse = metric.symbol === 'USDT.D'
    || metric.symbol === 'OPEN_INTEREST'
    || metric.symbol === 'FUNDING_RATES'
    || metric.symbol === 'LIQUIDATION_HEATMAP';

  if (symbol === 'BTC.D') {
    return {
      base: 'BTC Dominansı, toplam kripto piyasa değerinin ne kadarının Bitcoin’de toplandığını gösterir.',
      lowText: 'Düşük olması, sermayenin altcoinlere daha fazla yayıldığını ve risk iştahının Bitcoin dışına taştığını düşündürür.',
      highText: 'Yüksek olması, sermayenin daha savunmacı biçimde Bitcoin’de yoğunlaştığını ve piyasanın kalite/güvenlik aradığını düşündürür.',
    };
  }

  if (symbol === 'USDT.D') {
    return {
      base: 'USDT Dominansı, stablecoin ağırlığının toplam kripto piyasa içindeki payını gösterir.',
      lowText: 'Düşük olması, sermayenin stablecoin park alanından riskli varlıklara daha çok geçtiğini düşündürür.',
      highText: 'Yüksek olması, yatırımcıların savunmada kaldığını ve nakde yakın pozisyon taşımayı tercih ettiğini düşündürür.',
    };
  }

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
  if (symbol === 'XRP' || symbol === 'TRX' || symbol === 'DOGE') {
    return `$${value.toFixed(4)}`;
  }
  if (symbol === 'BNB' || symbol === 'SOL' || symbol === 'HYPE') {
    return `$${value.toFixed(2)}`;
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

function formatCryptoMetaDate(value: string | null) {
  if (!value) return '--';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year.slice(2)}`;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '--';
  return parsed.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function getHeatmapTileColor(mode: CryptoHeatmapMode, metric: DashboardData['pilotMetrics'][number]) {
  const change = metric.changePct ?? 0;
  const intensity = Math.min(1, Math.abs(change) / 8);

  if (mode === 'weight') {
    return {
      background: `linear-gradient(135deg, rgba(22,163,74,${0.24 + intensity * 0.14}) 0%, rgba(34,197,94,${0.48 + intensity * 0.18}) 100%)`,
      border: change >= 0 ? '#2F8F52' : '#3A7750',
      text: '#F3F4F6',
      value: '#E5E7EB',
    };
  }

  if (mode === 'price') {
    const up = change >= 0;
    return {
      background: up
        ? `linear-gradient(135deg, rgba(21,128,61,${0.28 + intensity * 0.16}) 0%, rgba(34,197,94,${0.40 + intensity * 0.18}) 100%)`
        : `linear-gradient(135deg, rgba(127,29,29,${0.30 + intensity * 0.16}) 0%, rgba(239,68,68,${0.38 + intensity * 0.18}) 100%)`,
      border: up ? '#2F8F52' : '#8F3A3A',
      text: '#F3F4F6',
      value: '#E5E7EB',
    };
  }

  if (mode === 'momentum') {
    const positive = change >= 0;
    return {
      background: positive
        ? `linear-gradient(135deg, rgba(5,150,105,${0.28 + intensity * 0.14}) 0%, rgba(52,211,153,${0.42 + intensity * 0.16}) 100%)`
        : `linear-gradient(135deg, rgba(153,27,27,${0.28 + intensity * 0.14}) 0%, rgba(248,113,113,${0.38 + intensity * 0.16}) 100%)`,
      border: positive ? '#289A74' : '#A74B4B',
      text: '#F3F4F6',
      value: '#E5E7EB',
    };
  }

  return {
    background: change >= 0
      ? `linear-gradient(135deg, rgba(22,163,74,${0.28 + intensity * 0.18}) 0%, rgba(74,222,128,${0.48 + intensity * 0.20}) 100%)`
      : `linear-gradient(135deg, rgba(153,27,27,${0.30 + intensity * 0.18}) 0%, rgba(248,113,113,${0.44 + intensity * 0.20}) 100%)`,
    border: change >= 0 ? '#2F8F52' : '#A74B4B',
    text: '#F3F4F6',
    value: '#F9FAFB',
  };
}

function formatHeatmapValue(mode: CryptoHeatmapMode, metric: DashboardData['pilotMetrics'][number]) {
  if (mode === 'change') {
    if (metric.changePct === null) return 'veri yok';
    const sign = (metric.change ?? 0) > 0 ? '+' : (metric.change ?? 0) < 0 ? '-' : '';
    return `${sign}${Math.abs(metric.changePct).toFixed(2)}%`;
  }

  if (mode === 'momentum') {
    const change = metric.changePct ?? 0;
    if (change >= 3) return 'Güçlü Alım';
    if (change >= 1) return 'Pozitif';
    if (change <= -3) return 'Sert Satış';
    if (change <= -1) return 'Zayıf';
    return 'Dengeli';
  }

  if (mode === 'price') {
    return formatCryptoPrice(metric.value, metric.symbol);
  }

  const weight = CRYPTO_HEATMAP_WEIGHTS[metric.symbol] ?? 1;
  return `%${weight}`;
}

function CryptoHeatmapPanel({
  metrics,
}: {
  metrics: DashboardData['pilotMetrics'];
}) {
  const [mode, setMode] = useState<CryptoHeatmapMode>('weight');
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);

  const heatmapMetrics = metrics
    .filter((metric) => metric.symbol in COIN_META)
    .sort((a, b) => (CRYPTO_HEATMAP_WEIGHTS[b.symbol] ?? 0) - (CRYPTO_HEATMAP_WEIGHTS[a.symbol] ?? 0));

  const topPositive = [...heatmapMetrics]
    .filter((metric) => metric.changePct !== null)
    .sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0))[0];

  const topNegative = [...heatmapMetrics]
    .filter((metric) => metric.changePct !== null)
    .sort((a, b) => (a.changePct ?? 0) - (b.changePct ?? 0))[0];

  const dominantCoin = heatmapMetrics[0] ?? null;
  const activeMetric = heatmapMetrics.find((metric) => metric.symbol === activeSymbol) ?? dominantCoin;

  if (heatmapMetrics.length === 0) {
    return null;
  }

  return (
    <div>
      <CryptoSectionHeader
        title="Kripto Isı Haritası"
        subtitle="Ana coinlerde ağırlık, günlük değişim, momentum ve fiyat dağılımını tek bakışta izlemek için."
      />

      <div
        className="rounded-sm border border-[#223043] bg-[#0C0C0C] p-4"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)',
          boxShadow: 'inset 0 0 0 1px rgba(96,165,250,0.05)',
        }}
      >
        <div className="mb-4 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-4 items-stretch">
          <div
            className="rounded-sm border border-[#213040] bg-[#0F1114] p-3"
            style={{
              backgroundImage: 'linear-gradient(135deg, rgba(96,165,250,0.08) 0%, transparent 28%)',
              boxShadow: 'inset 0 0 0 1px rgba(96,165,250,0.04)',
            }}
          >
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {CRYPTO_HEATMAP_MODES.map((tab) => {
                const active = tab.id === mode;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMode(tab.id)}
                    className="rounded-sm border px-4 py-2 text-[13px] font-medium transition-all"
                    style={{
                      color: active ? '#F5F5F5' : '#A3A3A3',
                      borderColor: active ? '#2A2A2A' : '#1A1A1A',
                      background: active ? 'linear-gradient(180deg, #202833 0%, #151A22 100%)' : '#121212',
                      boxShadow: active ? 'inset 0 0 0 1px rgba(255,255,255,0.03), 0 8px 18px rgba(0,0,0,0.18)' : 'none',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  key: 'leader',
                  title: 'Lider',
                  tone: getHeatmapSummaryTone('leader'),
                  symbol: dominantCoin ? COIN_META[dominantCoin.symbol].symbol : '--',
                  note: 'Ağırlıkta en büyük kutu',
                },
                {
                  key: 'positive',
                  title: 'En Güçlü',
                  tone: getHeatmapSummaryTone('positive'),
                  symbol: topPositive ? COIN_META[topPositive.symbol].symbol : '--',
                  note:
                    topPositive?.changePct !== null && topPositive?.changePct !== undefined
                      ? `+${topPositive.changePct.toFixed(2)}%`
                      : 'veri yok',
                },
                {
                  key: 'negative',
                  title: 'En Zayıf',
                  tone: getHeatmapSummaryTone('negative'),
                  symbol: topNegative ? COIN_META[topNegative.symbol].symbol : '--',
                  note:
                    topNegative?.changePct !== null && topNegative?.changePct !== undefined
                      ? `${topNegative.changePct.toFixed(2)}%`
                      : 'veri yok',
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className={`relative overflow-hidden rounded-sm border px-4 py-3 ${item.tone.border} ${item.tone.bg}`}
                  style={{ boxShadow: `inset 0 0 0 1px ${item.tone.accent}14` }}
                >
                  <div className="absolute inset-x-0 top-0 h-[2px]" style={{ backgroundColor: item.tone.accent }} />
                  <div className={`mb-2 text-[10px] uppercase tracking-[0.16em] ${item.tone.label}`}>{item.title}</div>
                  <div className={`text-lg font-semibold leading-none ${item.tone.value}`}>{item.symbol}</div>
                  <div className="mt-2 text-[11px] text-[#9A9A9A] leading-relaxed">{item.note}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-sm border border-[#1F3651] bg-[linear-gradient(135deg,rgba(59,130,246,0.14)_0%,rgba(14,23,34,0.96)_42%,rgba(10,12,16,0.98)_100%)] px-4 py-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#60A5FA]" />
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#93C5FD]">Kripto Isı Haritası Okuması</div>
              </div>
              <div className="text-sm text-[#E5EEF9] leading-relaxed">
                Alan büyüklüğü coin’in izlenen ağırlığını, renk tonu ise seçili moda göre anlık gücü gösterir.
                Büyük ve koyu yeşil kutular piyasa liderliğinin desteklendiğine, kırmızıya dönen büyük kutular ise baskının
                ana varlıklara yayıldığına işaret eder.
              </div>
            </div>
          </div>

          <div
            className="h-full rounded-sm border border-[#2A3340] bg-[#101317] p-3"
            style={{
              boxShadow: 'inset 0 0 0 1px rgba(125,211,252,0.04)',
              backgroundImage: 'linear-gradient(180deg, rgba(125,211,252,0.08) 0%, rgba(16,19,23,0.96) 18%, rgba(16,19,23,1) 100%)',
            }}
          >
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#8A8A8A] mb-2">Hover Detayı</div>
            {activeMetric && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="h-9 w-9 rounded-sm flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: `${COIN_META[activeMetric.symbol].color}22`, color: COIN_META[activeMetric.symbol].color }}
                  >
                    {COIN_META[activeMetric.symbol].symbol[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#F3F4F6]">{COIN_META[activeMetric.symbol].symbol}</div>
                    <div className="text-[11px] text-[#8A8A8A]">{COIN_META[activeMetric.symbol].label}</div>
                  </div>
                </div>
                <div className="space-y-2 text-[12px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#7A7A7A]">Fiyat</span>
                    <span className="font-mono text-[#E5E5E5]">{formatCryptoPrice(activeMetric.value, activeMetric.symbol)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#7A7A7A]">24s değişim</span>
                    <span className="font-mono" style={{ color: trendColor(activeMetric.trend) }}>
                      {activeMetric.changePct !== null && activeMetric.changePct !== undefined
                        ? `${(activeMetric.change ?? 0) > 0 ? '+' : ''}${activeMetric.changePct.toFixed(2)}%`
                        : '--'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#7A7A7A]">Ağırlık</span>
                    <span className="font-mono text-[#E5E5E5]">%{CRYPTO_HEATMAP_WEIGHTS[activeMetric.symbol] ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#7A7A7A]">Momentum</span>
                    <span className="font-mono text-[#E5E5E5]">{formatHeatmapValue('momentum', activeMetric)}</span>
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-[#26303B] text-[11px] text-[#8A8A8A] leading-relaxed">
                  Kutuların alanı izlenen ağırlığı, renk tonu ise seçili moddaki gücü ve yönü yansıtır.
                </div>
              </>
            )}
          </div>
        </div>

        <div
          className="rounded-sm border border-[#1A2533] bg-[radial-gradient(circle_at_top,#132132_0%,#0B0C0D_52%,#090909_100%)] p-3"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(96,165,250,0.04)' }}
        >
          <div className="grid grid-cols-12 grid-rows-5 gap-2 min-h-[460px]">
            {heatmapMetrics.map((metric) => {
              const meta = COIN_META[metric.symbol];
              const tone = getHeatmapTileColor(mode, metric);
              const isLarge = (CRYPTO_HEATMAP_WEIGHTS[metric.symbol] ?? 0) >= 20;
              const isActive = activeMetric?.symbol === metric.symbol;

              return (
                <button
                  key={`heat-${metric.id}`}
                  type="button"
                  onMouseEnter={() => setActiveSymbol(metric.symbol)}
                  onFocus={() => setActiveSymbol(metric.symbol)}
                  onClick={() => setActiveSymbol(metric.symbol)}
                  className={`relative rounded-sm border p-4 flex flex-col justify-between overflow-hidden text-left transition-all duration-200 hover:-translate-y-0.5 ${CRYPTO_HEATMAP_LAYOUT[metric.symbol] ?? 'col-span-2 row-span-1'}`}
                  style={{
                    background: tone.background,
                    borderColor: isActive ? '#F3F4F6' : tone.border,
                    boxShadow: isActive
                      ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.18), 0 18px 30px rgba(0,0,0,0.22)'
                      : 'inset 0 1px 0 rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 32%, rgba(0,0,0,0.10) 100%)' }} />
                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <div
                        className="font-semibold tracking-tight"
                        style={{
                          color: tone.text,
                          fontSize: isLarge ? '5.6rem' : (CRYPTO_HEATMAP_WEIGHTS[metric.symbol] ?? 0) >= 10 ? '2.15rem' : '1.05rem',
                          lineHeight: isLarge ? '0.9' : '1',
                        }}
                      >
                        {meta.symbol}
                      </div>
                      {!isLarge && (
                        <div className="mt-1 text-[11px] uppercase tracking-[0.16em]" style={{ color: `${tone.text}B8` }}>
                          {meta.label}
                        </div>
                      )}
                    </div>

                    {metric.changePct !== null && (
                      <div
                        className="rounded-sm px-2 py-1 text-[11px] font-mono"
                        style={{
                          color: tone.text,
                          background: 'rgba(10,10,10,0.18)',
                          border: '1px solid rgba(255,255,255,0.09)',
                          backdropFilter: 'blur(2px)',
                        }}
                      >
                        {(metric.change ?? 0) > 0 ? '+' : ''}{metric.changePct.toFixed(2)}%
                      </div>
                    )}
                  </div>

                  <div className="relative mt-auto">
                    <div
                      className="font-mono tabular-nums"
                      style={{
                        color: tone.value,
                        fontSize: isLarge ? '2.7rem' : (CRYPTO_HEATMAP_WEIGHTS[metric.symbol] ?? 0) >= 10 ? '1.55rem' : '1rem',
                        lineHeight: 1.05,
                      }}
                    >
                      {formatHeatmapValue(mode, metric)}
                    </div>
                    <div className="mt-2 text-[11px]" style={{ color: `${tone.text}CC` }}>
                      {mode === 'weight'
                        ? 'İzlenen ağırlık payı'
                        : mode === 'change'
                          ? 'Son 24 saat fiyat değişimi'
                          : mode === 'momentum'
                            ? 'Kısa vadeli yön kuvveti'
                            : 'Anlık spot fiyat'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
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

function PriceCard({ metric, showMetricDates, isFavorite, onToggleFavorite }: { metric: DashboardData['pilotMetrics'][0]; showMetricDates: boolean; isFavorite: boolean; onToggleFavorite: () => void }) {
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
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleFavorite}
            className={`rounded-sm border p-1 transition-colors ${isFavorite ? 'border-[#4B3A12] bg-[#1A160B] text-[#FBBF24]' : 'border-[#1F1F1F] bg-[#0D0D0D] text-[#666666] hover:text-[#FBBF24]'}`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-[#FBBF24]' : ''}`} />
          </button>
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
            ? formatCryptoMetaDate(metric.latestDate)
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
  showSparkline = false,
  isFavorite,
  onToggleFavorite,
}: {
  title: string;
  description: string;
  metric?: DashboardData['pilotMetrics'][0];
  showMetricDates: boolean;
  showSparkline?: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const tc = metric ? trendColor(metric.trend) : '#666666';

  return (
    <div className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4 min-h-[132px] flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-[#E5E5E5] uppercase tracking-wider">
            {title}
          </div>
          <div className="text-[10px] text-[#666666] mt-1 leading-relaxed">
            {description}
          </div>
        </div>
        <div className="flex items-start gap-1.5 shrink-0">
          {metric && (
            <button
              type="button"
              onClick={onToggleFavorite}
              className={`rounded-sm border p-1 transition-colors ${isFavorite ? 'border-[#4B3A12] bg-[#1A160B] text-[#FBBF24]' : 'border-[#1F1F1F] bg-[#0D0D0D] text-[#666666] hover:text-[#FBBF24]'}`}
            >
              <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-[#FBBF24]' : ''}`} />
            </button>
          )}
          {metric?.changePct !== null && metric?.changePct !== undefined ? (
            <div
              className="text-[11px] font-mono px-1.5 py-0.5 rounded-sm"
              style={{ color: tc, backgroundColor: `${tc}18` }}
            >
              {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : ''}
              {Math.abs(metric.changePct).toFixed(2)}%
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-auto">
        {metric ? (
          <>
            <div className="text-2xl font-mono tabular-nums text-[#E5E5E5] mb-2">
              {formatGenericValue(metric.symbol, metric.value)}
            </div>
            {showSparkline && metric.history.length > 1 && (
              <div className="h-12 -mx-1 mb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metric.history}>
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                    <Line type="monotone" dataKey="value" stroke={tc} strokeWidth={1.4} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="text-[10px] text-[#666666] font-mono">
              {showMetricDates
                ? (metric.latestUpdatedAt ?? metric.latestDate)
                  ? formatCryptoMetaDate(metric.latestUpdatedAt ?? metric.latestDate!)
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
  showSparkline = false,
  watchlist,
  onToggleFavorite,
}: {
  title: string;
  subtitle: string;
  items: Array<{ key: string; label: string; description: string; metric?: DashboardData['pilotMetrics'][0] }>;
  showMetricDates: boolean;
  showSparkline?: boolean;
  watchlist: { symbol: string }[];
  onToggleFavorite: (metric: DashboardData['pilotMetrics'][number]) => void;
}) {
  return (
    <div>
      <CryptoSectionHeader title={title} subtitle={subtitle} />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.key}>
            <SignalCard
              title={item.label}
              description={item.description}
              metric={item.metric}
              showMetricDates={showMetricDates}
              showSparkline={showSparkline}
              isFavorite={item.metric ? watchlist.some((w) => w.symbol === item.metric!.symbol) : false}
              onToggleFavorite={() => item.metric && onToggleFavorite(item.metric)}
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
  watchlist,
  onToggleFavorite,
  summaryCards = [],
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

  const metricMap = new Map(pilotMetrics.map((metric) => [metric.symbol, metric]));
  const priceMetrics = Object.keys(COIN_META)
    .map((symbol) => metricMap.get(symbol))
    .filter((metric): metric is DashboardData['pilotMetrics'][0] => Boolean(metric));
  const marketMetrics = Object.keys(MARKET_META)
    .map((symbol) => metricMap.get(symbol))
    .filter((metric): metric is DashboardData['pilotMetrics'][0] => Boolean(metric));
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
    .map((metric) => metric.latestUpdatedAt ?? metric.latestDate)
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
      <div
        className="relative rounded-sm border border-[#1A2E1A] overflow-hidden p-5"
        style={{
          background: 'linear-gradient(135deg, #0A1A0F 0%, #111111 55%, #0D1119 100%)',
          boxShadow: '0 0 0 1px rgba(74,222,128,0.05) inset, 0 16px 40px rgba(74,222,128,0.04)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #4ADE80 30%, #34D399 65%, transparent)' }} />

        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 mt-0.5">
            <div
              className={`w-2 h-2 rounded-full ${aiInsight ? 'bg-[#4ADE80] animate-pulse' : 'bg-[#444444]'}`}
              style={{ boxShadow: aiInsight ? '0 0 6px #4ADE80' : 'none' }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#4ADE80] mb-1.5">MERGEN AI · Analiz</div>
            <div className="text-[15px] font-bold text-[#E5E5E5] leading-snug">Kripto Para Piyasaları</div>
          </div>
          {confidenceClamp !== null && (
            <div className="flex-shrink-0 flex items-center gap-2 border border-[#1A2E1A] bg-[#0A1A0F] px-3 py-2 rounded-sm">
              <span className="text-[11px] font-mono text-[#4ADE80] whitespace-nowrap">Güven {confidenceClamp}/5</span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-2 w-4 rounded-[2px]"
                    style={{
                      background: i < confidenceClamp ? '#4ADE80' : '#1A2A1A',
                      boxShadow: i < confidenceClamp ? '0 0 4px rgba(74,222,128,0.5)' : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[#1A2E1A] mb-4" />

        {aiInsight ? (
          <>
            <div className="text-[13px] text-[#D4D4D4] leading-relaxed">{aiInsight}</div>
            {aiSimpleSummary && (
              <div className="mt-4 pt-4 border-t border-[#1A2E1A]">
                <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#4ADE80] mb-2">Sadeleştirilmiş kısa özet:</div>
                <div className="text-[13px] text-[#AAAAAA] leading-relaxed">{aiSimpleSummary}</div>
              </div>
            )}
          </>
        ) : (
          <div className="text-[13px] text-[#555555] leading-relaxed italic">
            Bu kategori için henüz AI yorumu oluşmadı. Sağ üstteki{' '}
            <span className="text-[#777777] not-italic">AI Prompt</span> butonuyla üretilebilir.
          </div>
        )}
      </div>

      <CryptoMetricsHeader
        title="Kripto Para Piyasaları Metrikleri"
        description="Kategoriye ait ana metrikleri, kapsama düzeyini ve alt kırılımları bu bölümde birlikte okuyabilirsin."
      />

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
            {lastUpdate ? formatCryptoMetaDate(lastUpdate) : '--'}
          </div>
          <div className="text-xs text-[#666666] mt-1">Kategori içindeki en güncel veri zamanı</div>
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

      {/* ── Section 2: Ana Kripto Varlıkları ── */}
      <div>
        <CryptoSectionHeader
          title="Ana Kripto Varlıkları"
          subtitle="Bitcoin, Ethereum ve ana piyasa liderlerinin fiyat davranisini ve guc dagilimini hizli okumak icin."
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {priceMetrics.map((m) => (
            <div key={m.id}>
              <PriceCard metric={m} showMetricDates={showMetricDates} isFavorite={watchlist.some((w) => w.symbol === m.symbol)} onToggleFavorite={() => onToggleFavorite(m)} />
            </div>
          ))}
          {priceMetrics.length === 0 && (
            <div className="col-span-full text-sm text-[#666666] font-mono py-8 text-center border border-dashed border-[#1F1F1F]">
              Kripto fiyat verisi henüz çekilmedi. Kategoriyi Çalıştır butonunu kullanın.
            </div>
          )}
        </div>
      </div>

      <CryptoHeatmapPanel metrics={priceMetrics} />

      {/* ── Section 3: Duyarlılık + Kurumsal Barometreler ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Fear & Greed */}
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4">
          <CryptoSectionHeader title="Duyarlılık ve Perakende İlgi" />
        <div className="grid grid-cols-1 gap-4 mb-4">
          {sentimentItems.map((item) => (
            <div key={item.key}>
              <SignalCard
                title={item.label}
                description={item.description}
                metric={item.metric}
                showMetricDates={showMetricDates}
                isFavorite={item.metric ? watchlist.some((w) => w.symbol === item.metric!.symbol) : false}
                onToggleFavorite={() => item.metric && onToggleFavorite(item.metric)}
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
          <CryptoSectionHeader title="Kurumsal ve Şirket Barometreleri" />
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
            <div className="rounded-sm border border-[#1A1A1A] bg-[#101010] px-3 py-2.5 text-[11px] text-[#8F8F8F] leading-6">
              <span className="text-[#E5E5E5] font-semibold">COIN</span>{' '}
              kurumsal kripto adaptasyonunun en likit borsa barometresidir.{' '}
              <span className="text-[#E5E5E5] font-semibold">MSTR</span>{' '}
              kaldiracli BTC pozisyonu nedeniyle volatilite amplifikatoru gibi davranir.{' '}
              <span className="text-[#E5E5E5] font-semibold">CRCL</span>{' '}
              ise stablecoin altyapisi ve regule kripto finansinin kurumsal benimsenme tarafini yansitir.
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
        showSparkline
        watchlist={watchlist}
        onToggleFavorite={onToggleFavorite}
      />

      {/* ── Section 5: Türev Piyasalar ve Kaldıraç ── */}
      <SectionBlock
        title="Türev Piyasalar ve Kaldıraç"
        subtitle="Aşırı kaldıraç, tek taraflı kalabalık ve olası tasfiye sıkışmalarını okumak için."
        items={derivativesItems}
        showMetricDates={showMetricDates}
        watchlist={watchlist}
        onToggleFavorite={onToggleFavorite}
      />

      {/* ── Section 6: Stablecoin Likiditesi ── */}
      <SectionBlock
        title="Stablecoin Likiditesi"
        subtitle="Sisteme giren taze dolar-benzeri likiditeyi ve borsalara akış yönünü izlemek için."
        items={stablecoinItems}
        showMetricDates={showMetricDates}
        watchlist={watchlist}
        onToggleFavorite={onToggleFavorite}
      />

      <SectionBlock
        title="On-Chain Yapısal Sağlık"
        subtitle="Ağ içi benimsenme, sermaye kalitesi ve madencilik ekonomisi."
        items={onchainItems}
        showMetricDates={showMetricDates}
        watchlist={watchlist}
        onToggleFavorite={onToggleFavorite}
      />

      {/* ── Section 7: Makro Korelasyon Çerçevesi ── */}
      <div>
        <CryptoSectionHeader
          title="Makro Korelasyon Çerçevesi"
          subtitle="Kripto varliklarin dolar, faiz, altin ve risk istahi ile kurdugu iliskiyi daha net gormek icin."
        />
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

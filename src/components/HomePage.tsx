import React, { useMemo, useState } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';
import {
  Activity, TrendingUp, TrendingDown, Minus,
  Zap, Map, ArrowRight, BookOpen, Eye, Globe,
  ShieldAlert, Landmark, Flame, Thermometer, Ship, Flag, Star, X,
} from 'lucide-react';
import type { DashboardData } from '../hooks/useDashboardData';

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

function scoreColor(score: number | null): string {
  if (score === null) return '#4A4A4A';
  if (score >= 70) return '#4ADE80';
  if (score >= 50) return '#FBBF24';
  if (score >= 30) return '#FB923C';
  return '#F87171';
}

function scoreBg(score: number | null): string {
  if (score === null) return '#111111';
  if (score >= 70) return '#0A1A0A';
  if (score >= 50) return '#141008';
  if (score >= 30) return '#160C06';
  return '#180808';
}

function scoreBorder(score: number | null): string {
  if (score === null) return '#1F1F1F';
  if (score >= 70) return '#1A3A1A';
  if (score >= 50) return '#3A3010';
  if (score >= 30) return '#3A1E0A';
  return '#3A1010';
}

function scoreWord(score: number | null): string {
  if (score === null) return 'Veri Yok';
  if (score >= 75) return 'Risk-On';
  if (score >= 55) return 'Nötr';
  if (score >= 35) return 'Savunmacı';
  return 'Stresli';
}

function scoreRegime(score: number | null): 'risk-on' | 'neutral' | 'defensive' | 'stressed' | 'unknown' {
  if (score === null) return 'unknown';
  if (score >= 75) return 'risk-on';
  if (score >= 55) return 'neutral';
  if (score >= 35) return 'defensive';
  return 'stressed';
}

function findCat(categories: DashboardData['categories'], ...keywords: string[]) {
  for (const kw of keywords) {
    const cat = categories.find(c => c.name.toLowerCase().includes(kw.toLowerCase()));
    if (cat?.score !== null && cat?.score !== undefined) return cat;
  }
  return null;
}

function findScore(categories: DashboardData['categories'], ...keywords: string[]): number {
  return findCat(categories, ...keywords)?.score ?? 50;
}

function clampScore(value: number, min = 5, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

// ─────────────────────────────────────────────────────────────
// REGIME READING FLOW — uses full category names
// ─────────────────────────────────────────────────────────────

const REGIME_FLOWS: Record<string, {
  label: string; color: string; desc: string;
  keywords: string[][];
}> = {
  'risk-on': {
    label: 'Risk-On Rejimi',
    color: '#4ADE80',
    desc: 'Momentum güçlü, risk iştahı yaygın. Büyüme ve genişlik öne çıkan alanlar.',
    keywords: [
      ['piyasa genişliği', 'pozisyon'],
      ['etf', 'sermaye akışı'],
      ['gelişmekte'],
      ['teknoloji', 'yapısal'],
      ['kripto'],
    ],
  },
  'neutral': {
    label: 'Nötr Rejim',
    color: '#FBBF24',
    desc: 'Karışık sinyaller, yön net değil. Kırılganlıklar ve yapısal faktörler ön planda.',
    keywords: [
      ['siyasi', 'sosyal'],
      ['volatilite', 'türev'],
      ['piyasa genişliği', 'pozisyon'],
      ['likidite'],
      ['büyüme', 'reel ekonomi'],
    ],
  },
  'defensive': {
    label: 'Savunmacı Rejim',
    color: '#FB923C',
    desc: 'Kırılganlık artıyor, piyasa daha seçici. Stres ve risk göstergelerini izle.',
    keywords: [
      ['volatilite', 'türev'],
      ['kredi', 'finansal stres'],
      ['kamu maliyesi', 'sovereign'],
      ['döviz', 'kur'],
      ['değerli metaller'],
    ],
  },
  'stressed': {
    label: 'Stresli Rejim',
    color: '#F87171',
    desc: 'Baskı yüksek, finansal ve makro stres öne çıkıyor. Savunma öncelikli.',
    keywords: [
      ['kredi', 'finansal stres'],
      ['volatilite', 'türev'],
      ['kamu maliyesi', 'sovereign'],
      ['fed', 'para politikası'],
      ['enerji'],
    ],
  },
  'unknown': {
    label: 'Veri Bekleniyor',
    color: '#555555',
    desc: 'Yeterli veri yok, rejim belirlenemiyor.',
    keywords: [],
  },
};

// ─────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────

type WatchlistItem = {
  symbol: string;
  name: string;
  categoryId: string;
  categoryName: string;
  latestValue: number | null;
  latestDate: string | null;
  trend: 'up' | 'down' | 'flat';
};

interface HomePageProps {
  totalScore: number | null;
  totalScoreChange7d: number | null;
  totalScoreTrend: 'up' | 'down' | 'flat';
  loading: boolean;
  categories: DashboardData['categories'];
  alerts: DashboardData['alerts'];
  divergences: DashboardData['divergences'];
  homeInsight: string | null;
  homeSimpleSummary: string | null;
  marketDirectionSummary: string | null;
  homeConfidence: number | null;
  visiblePlaceholders: [string, string][];
  onSelectCategory: (id: string) => void;
  totalFetchedMetrics: number;
  totalTrackedMetrics: number;
  showDirectionCard?: boolean;
  watchlist?: WatchlistItem[];
  onRemoveFromWatchlist?: (symbol: string) => void;
}

function PremiumPanelHeader({
  icon,
  title,
  accent,
  subtitle,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  accent: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden border-b px-4 py-3"
      style={{
        borderBottomColor: `${accent}22`,
        background: `linear-gradient(135deg, ${accent}18 0%, rgba(24,24,24,0.52) 24%, rgba(15,15,18,0.96) 58%, rgba(15,15,18,1) 100%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)`,
        boxShadow: `inset 0 0 0 1px ${accent}08`,
      }}
    >
      <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${accent} 0%, ${accent}CC 45%, ${accent}66 100%)` }} />
      <div className="absolute -left-8 top-0 h-20 w-20 rounded-full blur-2xl pointer-events-none" style={{ backgroundColor: `${accent}12` }} />
      <div className="absolute right-4 top-2 h-12 w-12 rounded-full blur-2xl pointer-events-none" style={{ backgroundColor: `${accent}10` }} />

      <div className="relative flex items-start gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border"
          style={{
            borderColor: `${accent}30`,
            backgroundColor: `${accent}14`,
            color: accent,
            boxShadow: `inset 0 0 14px ${accent}12`,
          }}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div
            className="inline-flex items-center rounded-sm border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{
              color: accent,
              borderColor: `${accent}36`,
              backgroundColor: `${accent}14`,
              boxShadow: `inset 0 0 0 1px ${accent}10`,
            }}
          >
            {title}
          </div>
          {subtitle && <div className="mt-2 text-[11px] leading-relaxed text-[#A8A8A8]">{subtitle}</div>}
        </div>

        {right && <div className="shrink-0">{right}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ALERT TYPE META
// ─────────────────────────────────────────────────────────────

function alertMeta(type: string) {
  if (type === 'threshold') return { label: 'Eşik Aşıldı', dot: 'bg-[#F87171]', pill: 'border-[#3F1818] bg-[#140B0B] text-[#F87171]' };
  if (type === 'momentum') return { label: 'Momentum', dot: 'bg-[#FBBF24]', pill: 'border-[#3C3113] bg-[#120F0A] text-[#FBBF24]' };
  return { label: 'Ayrışma', dot: 'bg-[#60A5FA]', pill: 'border-[#1D2C44] bg-[#0D1420] text-[#60A5FA]' };
}

// ─────────────────────────────────────────────────────────────
// WORLD MAP
// ─────────────────────────────────────────────────────────────

const MAP_MODES = [
  { id: 'risk', label: 'Bölgesel Risk' },
  { id: 'capital', label: 'Sermaye Akışı' },
  { id: 'energy', label: 'Enerji Baskısı' },
  { id: 'inflation', label: 'Enflasyon' },
  { id: 'growth', label: 'Büyüme' },
  { id: 'trade', label: 'Ticaret Zinciri' },
  { id: 'geo', label: 'Jeopolitik' },
] as const;

type MapMode = typeof MAP_MODES[number]['id'];

const MAP_MODE_STYLES: Record<MapMode, { accent: string; bg: string; text: string; shadow: string }> = {
  risk: { accent: '#60A5FA', bg: '#0B1522', text: '#DBEAFE', shadow: 'rgba(96,165,250,0.22)' },
  capital: { accent: '#22C55E', bg: '#09170F', text: '#DCFCE7', shadow: 'rgba(34,197,94,0.22)' },
  energy: { accent: '#F59E0B', bg: '#191207', text: '#FEF3C7', shadow: 'rgba(245,158,11,0.22)' },
  inflation: { accent: '#FB7185', bg: '#1A0D12', text: '#FFE4E6', shadow: 'rgba(251,113,133,0.22)' },
  growth: { accent: '#34D399', bg: '#071711', text: '#D1FAE5', shadow: 'rgba(52,211,153,0.22)' },
  trade: { accent: '#A78BFA', bg: '#120C1D', text: '#E9D5FF', shadow: 'rgba(167,139,250,0.22)' },
  geo: { accent: '#F87171', bg: '#180909', text: '#FEE2E2', shadow: 'rgba(248,113,113,0.22)' },
};

const MAP_MODE_ICONS: Record<MapMode, React.ComponentType<{ className?: string }>> = {
  risk: ShieldAlert,
  capital: Landmark,
  energy: Flame,
  inflation: Thermometer,
  growth: TrendingUp,
  trade: Ship,
  geo: Flag,
};

interface MapRegion {
  id: string;
  label: string;
  path: string;
  cx: number;
  cy: number;
  categoryKeywords: string[];
  metrics: Record<MapMode, { items: string[]; note: string }>;
}

// Equirectangular projection: x=(lon+180)*2.667, y=(90-lat)*2.778  viewBox 960×500
const MAP_REGIONS: MapRegion[] = [
  {
    id: 'northamerica',
    label: 'ABD / K. Amerika',
    path: 'M26,106 L42,72 L86,60 L138,56 L208,48 L262,66 L314,82 L338,118 L300,128 L284,150 L274,182 L254,206 L214,198 L178,186 L150,160 L136,130 L114,108 L78,100 L50,100 Z',
    cx: 196, cy: 146,
    categoryKeywords: ['fed', 'büyüme', 'enflasyon', 'etf'],
    metrics: {
      risk: { items: ['Fed politikası', 'Enflasyon baskısı', 'İstihdam piyasası'], note: 'Ana risk merkezi' },
      capital: { items: ['ETF girişleri', 'Tahvil talebi', 'Dolar güçlenmesi'], note: 'Sermaye çekici' },
      energy: { items: ['Şist petrol üretimi', 'Doğalgaz ihracatı', 'Enerji bağımsızlığı'], note: 'Net ihracatçı' },
      inflation: { items: ['Çekirdek PCE', 'Konut enflasyonu', 'Ücret baskısı'], note: 'Yapışkan enflasyon' },
      growth: { items: ['GDP büyüme', 'PMI göstergeleri', 'Perakende satışlar'], note: 'Yavaşlama sinyali' },
      trade: { items: ['İthalat hacmi', 'Tarife politikası', 'Ticaret açığı'], note: 'Büyük tüketici' },
      geo: { items: ['NATO liderliği', 'Çin gerilimi', 'Ukrayna desteği'], note: 'Yüksek etki' },
    },
  },
  {
    id: 'southamerica',
    label: 'G. Amerika',
    path: 'M286,224 L326,218 L386,234 L386,276 L374,314 L350,338 L328,360 L310,402 L288,388 L290,344 L292,304 L276,280 L268,244 Z',
    cx: 328, cy: 314,
    categoryKeywords: ['gelişmekte', 'tarımsal'],
    metrics: {
      risk: { items: ['Döviz kırılganlığı', 'Borç yükü', 'Siyasi istikrarsızlık'], note: 'Orta risk' },
      capital: { items: ['EM fon çıkışı', 'Dolar borçlanması', 'Portföy akışı'], note: 'Çıkış riski' },
      energy: { items: ['Petrol kaynakları', 'Biyoyakıt üretimi', 'Enerji ihracatı'], note: 'Üretici bölge' },
      inflation: { items: ['Gıda enflasyonu', 'Kur etkisi', 'Tarımsal fiyatlar'], note: 'Yüksek enflasyon' },
      growth: { items: ['Brezilya PMI', 'Tarım ihracatı', 'İç talep'], note: 'Karma görünüm' },
      trade: { items: ['Hammadde ihracatı', 'Çin bağlantısı', 'Tarım ürünleri'], note: 'Emtia odaklı' },
      geo: { items: ['Bölgesel istikrar', 'ABD etkisi', 'Çin yatırımı'], note: 'Düşük-orta risk' },
    },
  },
  {
    id: 'europe',
    label: 'Avrupa',
    path: 'M446,148 L452,124 L470,98 L496,78 L528,58 L548,52 L562,58 L562,84 L548,102 L560,118 L548,136 L532,148 L516,142 L500,146 L482,138 L462,146 Z',
    cx: 507, cy: 110,
    categoryKeywords: ['küresel', 'döviz', 'kamu maliyesi'],
    metrics: {
      risk: { items: ['Enerji bağımlılığı', 'Siyasi parçalanma', 'Büyüme zayıflığı'], note: 'Savunmacı bölge' },
      capital: { items: ['Avrupa fon girişi', 'Euro tahvil talebi', 'Bankacılık akışı'], note: 'Seçici giriş' },
      energy: { items: ['Doğalgaz fiyatları', 'Rusya bağımlılığı', 'Yenilenebilir geçiş'], note: 'Yüksek baskı' },
      inflation: { items: ['Çekirdek enflasyon', 'Enerji dezenflasyonu', 'Ücret baskısı'], note: 'Dezenflasyon süreci' },
      growth: { items: ['Almanya sanayi', 'PMI zayıflığı', 'İhracat daralması'], note: 'Durgunluk riski' },
      trade: { items: ['AB ticaret dengesi', 'Çin ihracatı', 'Tedarik zinciri'], note: 'Daralma trendi' },
      geo: { items: ['Ukrayna savaşı', 'Rusya gerilimi', 'NATO güçlenmesi'], note: 'Çok yüksek etki' },
    },
  },
  {
    id: 'russia',
    label: 'Rusya / Orta Asya',
    path: 'M560,60 L590,54 L648,42 L730,44 L806,50 L894,66 L924,74 L892,86 L870,108 L842,128 L794,118 L736,112 L676,106 L620,104 L580,96 L560,82 Z',
    cx: 722, cy: 88,
    categoryKeywords: ['enerji', 'küresel'],
    metrics: {
      risk: { items: ['Savaş ekonomisi', 'Yaptırım baskısı', 'Ruble kırılganlığı'], note: 'Çok yüksek risk' },
      capital: { items: ['Sermaye kaçışı', 'Yabancı çıkışı', 'Rezerv kullanımı'], note: 'Negatif akış' },
      energy: { items: ['Petrol ihracatı', 'Doğalgaz kesintisi', 'OPEC+ ilişkisi'], note: 'Kritik tedarikçi' },
      inflation: { items: ['Savaş enflasyonu', 'Kur baskısı', 'Gıda fiyatları'], note: 'Yapısal enflasyon' },
      growth: { items: ['Savunma sektörü', 'Tüketim daralması', 'İhracat gelirleri'], note: 'Savaş ekonomisi' },
      trade: { items: ['Batı boykotu', 'Asya yönlendirmesi', 'Emtia ihracatı'], note: 'Yeniden yapılanma' },
      geo: { items: ['Ukrayna işgali', 'NATO sınırı', 'Çin ortaklığı'], note: 'En yüksek gerilim' },
    },
  },
  {
    id: 'middleeast',
    label: 'Orta Doğu',
    path: 'M548,148 L576,136 L612,136 L640,144 L646,176 L638,192 L618,214 L600,218 L580,188 L564,164 L572,154 Z',
    cx: 598, cy: 174,
    categoryKeywords: ['enerji', 'küresel'],
    metrics: {
      risk: { items: ['Çatışma riski', 'Petrol fiyat şoku', 'Jeopolitik gerilim'], note: 'Yüksek risk' },
      capital: { items: ['Petrodolar geri dönüşü', 'Körfez yatırımları', 'Süveyş geçiş geliri'], note: 'Petrodolar akışı' },
      energy: { items: ['OPEC üretim kararları', 'Körfez kapasitesi', 'LNG ihracatı'], note: 'Küresel belirleyici' },
      inflation: { items: ['Petrol kaynaklı baskı', 'Gıda ithalatı', 'Kur politikası'], note: 'İhraç eden baskı' },
      growth: { items: ['Petrol bağımlı büyüme', 'Çeşitlendirme', 'İnşaat sektörü'], note: 'Petrol belirleyici' },
      trade: { items: ['Petrol ihracatı', 'Hürmüz Boğazı', 'Kızıldeniz rotası'], note: 'Kritik güzergah' },
      geo: { items: ['İsrail-Hamas çatışması', 'İran gerginliği', 'Yemen krizi'], note: 'En yüksek gerilim' },
    },
  },
  {
    id: 'africa',
    label: 'Afrika',
    path: 'M474,154 L456,178 L438,214 L450,238 L490,240 L512,254 L514,296 L526,330 L530,350 L548,348 L572,306 L594,266 L616,220 L598,206 L582,186 L566,164 L526,156 L502,150 Z',
    cx: 528, cy: 258,
    categoryKeywords: ['gelişmekte', 'tarımsal'],
    metrics: {
      risk: { items: ['Borç krizi riski', 'Gıda güvensizliği', 'Siyasi istikrarsızlık'], note: 'Yapısal risk' },
      capital: { items: ['EM fon çıkışı', 'Çin borç finansmanı', 'IMF programları'], note: 'Kırılgan akış' },
      energy: { items: ['Petrol üreticileri', 'Enerji altyapısı', 'Yenilenebilir potansiyel'], note: 'Gelişen kapasite' },
      inflation: { items: ['Gıda enflasyonu', 'İthal enflasyon', 'Kur baskısı'], note: 'Kronik baskı' },
      growth: { items: ['Nüfus artışı', 'Altyapı yatırımı', 'Tarım sektörü'], note: 'Uzun vadeli potansiyel' },
      trade: { items: ['Hammadde ihracatı', 'Kıta içi ticaret', 'Çin bağlantısı'], note: 'Hammadde odaklı' },
      geo: { items: ['Wagner grubu', 'Çin nüfuzu', 'Bölgesel çatışmalar'], note: 'Yüksek gerilim' },
    },
  },
  {
    id: 'southasia',
    label: 'Güney Asya',
    path: 'M654,152 L678,160 L704,170 L724,178 L724,190 L700,206 L686,228 L672,198 L650,184 Z',
    cx: 688, cy: 194,
    categoryKeywords: ['gelişmekte', 'döviz'],
    metrics: {
      risk: { items: ['Döviz kırılganlığı', 'Siyasi istikrarsızlık', 'Jeopolitik gerilim'], note: 'Orta-yüksek risk' },
      capital: { items: ['FDI girişleri', 'Portföy dalgalanması', 'Dolar borçlanması'], note: 'Seçici akış' },
      energy: { items: ['Enerji ithalatçısı', 'Petrol bağımlılığı', 'Yenilenebilir büyüme'], note: 'Yüksek bağımlılık' },
      inflation: { items: ['Gıda enflasyonu', 'Kur geçişkenliği', 'Enerji baskısı'], note: 'Yapışkan enflasyon' },
      growth: { items: ['Hindistan PMI', 'Hizmet sektörü', 'Nüfus avantajı'], note: 'Güçlü momentum' },
      trade: { items: ['Tekstil ihracatı', 'IT hizmetleri', 'Emtia ithalatı'], note: 'Diversifiye yapı' },
      geo: { items: ['Çin-Hindistan sınırı', 'Pakistan gerilimi', 'Hint Okyanusu rekabeti'], note: 'Orta gerilim' },
    },
  },
  {
    id: 'china',
    label: 'Çin / Doğu Asya',
    path: 'M670,138 L694,118 L748,110 L820,112 L838,126 L832,152 L812,174 L786,188 L756,188 L738,170 L716,166 L688,154 L662,148 Z',
    cx: 746, cy: 150,
    categoryKeywords: ['gelişmekte', 'ticaret', 'tedarik'],
    metrics: {
      risk: { items: ['Deflasyon riski', 'Gayrimenkul krizi', 'Jeopolitik gerilim'], note: 'Orta-yüksek risk' },
      capital: { items: ['Sermaye çıkışı', 'Yabancı yatırım kaçışı', 'Dolar talebi'], note: 'Net çıkış eğilimi' },
      energy: { items: ['Enerji ithalatı', 'Kömür tüketimi', 'Yenilenebilir kapasitesi'], note: 'Büyük tüketici' },
      inflation: { items: ['Deflasyon baskısı', 'PPI negatif', 'Tüketim zayıflığı'], note: 'Dezenflasyon riski' },
      growth: { items: ['PMI verileri', 'İhracat ivmesi', 'İç talep zayıflığı'], note: 'Yavaşlama' },
      trade: { items: ['Küresel ihracatçı', 'Tedarik zinciri merkezi', 'Tarife savaşı'], note: 'Belirleyici güç' },
      geo: { items: ['Tayvan gerginliği', 'Güney Çin Denizi', 'Ticaret savaşı'], note: 'Kritik gerilim' },
    },
  },
  {
    id: 'japan',
    label: 'Japonya',
    path: 'M852,124 L858,132 L854,144 L846,154 L838,166 L844,172 L854,160 L860,146 L862,132 Z',
    cx: 850, cy: 148,
    categoryKeywords: ['döviz', 'büyüme'],
    metrics: {
      risk: { items: ['YEN kırılganlığı', 'Deflasyon döngüsü', 'Borç sürdürülebilirliği'], note: 'Para politikası riski' },
      capital: { items: ['YEN carry trade', 'Küresel likidite etkisi', 'BOJ kararları'], note: 'Sistemik önem' },
      energy: { items: ['Enerji ithalatçısı', 'Nükleer kapasitesi', 'LNG bağımlılığı'], note: 'Tam bağımlı' },
      inflation: { items: ['BOJ hedef arayışı', 'Çekirdek enflasyon', 'İthalat baskısı'], note: 'Geç enflasyon' },
      growth: { items: ['İhracat odaklı', 'İç tüketim', 'Sanayi üretimi'], note: 'Durgun büyüme' },
      trade: { items: ['Otomotiv ihracatı', 'Elektronik ihracatı', 'Ticaret dengesi'], note: 'İhracat bağımlı' },
      geo: { items: ['Çin-Japonya gerilimi', 'Kuzey Kore riski', 'ABD müttefikliği'], note: 'Orta gerilim' },
    },
  },
  {
    id: 'seasia',
    label: 'G.D. Asya',
    path: 'M756,190 L786,196 L812,204 L820,220 L804,232 L792,244 L788,266 L766,264 L756,246 L746,236 L766,220 Z',
    cx: 784, cy: 230,
    categoryKeywords: ['gelişmekte', 'ticaret'],
    metrics: {
      risk: { items: ['Döviz kırılganlığı', 'Tedarik zinciri riski', 'Jeopolitik baskı'], note: 'Orta risk' },
      capital: { items: ['FDI çekimi', 'Çin+1 stratejisi', 'Portföy akışı'], note: 'Artan çekim' },
      energy: { items: ['LNG bağımlılığı', 'Kömür geçişi', 'Yenilenebilir kapasitesi'], note: 'Geçiş dönemi' },
      inflation: { items: ['İthal enflasyon', 'Kur baskısı', 'Gıda fiyatları'], note: 'Orta baskı' },
      growth: { items: ['Üretim merkezi', 'İhracat büyümesi', 'Tüketim artışı'], note: 'Hızlı büyüme' },
      trade: { items: ['Tedarik zinciri merkezi', 'Liman kapasitesi', 'Konteyner akışı'], note: 'Kritik güzergah' },
      geo: { items: ['Güney Çin Denizi', 'Hainan adası gerilimi', 'ABD varlığı'], note: 'Orta-yüksek gerilim' },
    },
  },
  {
    id: 'australia',
    label: 'Avustralya',
    path: 'M784,314 L806,302 L834,292 L870,302 L886,330 L876,354 L846,356 L808,348 L786,334 Z',
    cx: 834, cy: 326,
    categoryKeywords: ['gelişmekte', 'tarımsal'],
    metrics: {
      risk: { items: ['Emtia bağımlılığı', 'Çin ilişkileri', 'İklim riski'], note: 'Düşük-orta risk' },
      capital: { items: ['Madencilik yatırımı', 'FDI girişleri', 'AUD volatilitesi'], note: 'Emtia bağlantılı' },
      energy: { items: ['LNG ihracatı', 'Kömür ihracatı', 'Yenilenebilir geçiş'], note: 'Büyük ihracatçı' },
      inflation: { items: ['Konut fiyatları', 'Ücret baskısı', 'Emtia geçişkenliği'], note: 'Orta baskı' },
      growth: { items: ['Madencilik sektörü', 'Hizmet ekonomisi', 'Göç artışı'], note: 'Dayanıklı büyüme' },
      trade: { items: ['Demir cevheri ihracatı', 'LNG ihracatı', 'Tarım ihracatı'], note: 'Emtia ihracatçısı' },
      geo: { items: ['Çin-Avustralya ilişkisi', 'AUKUS paktı', 'Pasifik güvenlik'], note: 'Düşük-orta gerilim' },
    },
  },
];

function WorldMap({
  categories,
  onSelectCategory,
}: {
  categories: DashboardData['categories'];
  onSelectCategory: (id: string) => void;
}) {
  const [activeMode, setActiveMode] = useState<MapMode>('risk');
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const regionScores = useMemo(() => {
    const scores: Record<string, number> = {};

    for (const region of MAP_REGIONS) {
      // Base proxy score from matched categories.
      // High score = more resilient / lower stress.
      let scoreSum = 0;
      let count = 0;
      for (const kw of region.categoryKeywords) {
        const cat = categories.find(c => c.name.toLowerCase().includes(kw.toLowerCase()));
        if (cat?.score != null) {
          scoreSum += cat.score;
          count++;
        }
      }
      let score = count > 0 ? scoreSum / count : 50;

      if (activeMode === 'risk') {
        const globalRisk = findScore(categories, 'küresel risk');
        const credit = findScore(categories, 'kredi', 'finansal stres');
        const growth = findScore(categories, 'büyüme', 'reel ekonomi');
        const social = findScore(categories, 'siyasi', 'sosyal');
        const energy = findScore(categories, 'enerji');
        const liquidity = findScore(categories, 'likidite');

        const resilienceBase = (
          score * 0.34
          + globalRisk * 0.16
          + credit * 0.14
          + growth * 0.12
          + social * 0.12
          + energy * 0.06
          + liquidity * 0.06
        );

        const regionalBias: Record<string, number> = {
          northamerica: 10,
          europe: -6,
          russia: -34,
          middleeast: -28,
          africa: -20,
          southasia: -10,
          china: -8,
          japan: 8,
          seasia: -4,
          southamerica: -8,
          australia: 12,
        };

        score = clampScore(resilienceBase + (regionalBias[region.id] ?? 0));
      }

      // Adjust score per mode
      if (activeMode === 'capital') {
        // High score = lower net capital stress / stronger capital absorption.
        // We blend market depth, liquidity, FX stability and credit conditions,
        // then add regional structural access to global capital.
        const etf = findScore(categories, 'etf', 'sermaye');
        const liquidity = findScore(categories, 'likidite');
        const credit = findScore(categories, 'kredi', 'finansal stres');
        const fx = findScore(categories, 'döviz', 'kur');
        const globalRisk = findScore(categories, 'küresel risk');

        const capitalResilienceBase = (
          etf * 0.34
          + liquidity * 0.24
          + credit * 0.16
          + fx * 0.14
          + globalRisk * 0.12
        );

        const regionalBias: Record<string, number> = {
          northamerica: 18,
          europe: 6,
          russia: -34,
          middleeast: 4,
          africa: -16,
          southasia: -8,
          china: -12,
          japan: 8,
          seasia: 2,
          southamerica: -10,
          australia: 10,
        };

        score = clampScore(capitalResilienceBase + (regionalBias[region.id] ?? 0));
      } else if (activeMode === 'energy') {
        // High score = lower net energy pressure / stronger resilience.
        // We combine the global energy regime with inflation pass-through,
        // trade-chain fragility and regional structural dependence.
        const energy = findScore(categories, 'enerji');
        const trade = findScore(categories, 'ticaret', 'tedarik');
        const inflation = findScore(categories, 'enflasyon');
        const growth = findScore(categories, 'büyüme', 'reel ekonomi');
        const globalRisk = findScore(categories, 'küresel risk');

        const energyResilienceBase = (
          energy * 0.42
          + trade * 0.16
          + growth * 0.12
          + (100 - inflation) * 0.14
          + globalRisk * 0.16
        );

        const regionalBias: Record<string, number> = {
          northamerica: 18,   // shale + gas exporter + infrastructure depth
          southamerica: 8,    // producer regions but still infrastructure gaps
          europe: -18,        // import dependence and gas sensitivity
          russia: -6,         // exporter, but sanctions/logistics pressure
          middleeast: -12,    // producer strength offset by chokepoint/conflict risk
          africa: -6,         // resource base exists, resilience weak/infrastructure thin
          southasia: -20,     // heavy import dependence
          china: -14,         // giant importer, industrial energy intensity
          japan: -24,         // near-total import dependence
          seasia: -10,        // mixed system, still externally exposed
          australia: 16,      // LNG/coal exporter
        };

        score = clampScore(energyResilienceBase + (regionalBias[region.id] ?? 0));
      } else if (activeMode === 'inflation') {
        // High score = lower inflation pressure / better inflation resilience.
        // Energy pass-through, FX stability and demand conditions all matter.
        const inflation = findScore(categories, 'enflasyon');
        const energy = findScore(categories, 'enerji');
        const fx = findScore(categories, 'döviz', 'kur');
        const growth = findScore(categories, 'büyüme', 'reel ekonomi');

        const inflationResilienceBase = (
          (100 - inflation) * 0.46
          + energy * 0.18
          + fx * 0.18
          + growth * 0.18
        );

        const regionalBias: Record<string, number> = {
          northamerica: 4,
          europe: 2,
          russia: -20,
          middleeast: -4,
          africa: -22,
          southasia: -14,
          china: 10,
          japan: 6,
          seasia: -6,
          southamerica: -18,
          australia: 5,
        };

        score = clampScore(inflationResilienceBase + (regionalBias[region.id] ?? 0), 8);
      } else if (activeMode === 'growth') {
        // High score = stronger growth resilience / better cyclical impulse.
        // We blend real-economy strength with trade, credit and structural growth engines.
        const growth = findScore(categories, 'büyüme', 'reel ekonomi');
        const trade = findScore(categories, 'ticaret', 'tedarik');
        const credit = findScore(categories, 'kredi', 'finansal stres');
        const tech = findScore(categories, 'teknoloji', 'yapısal');

        const growthResilienceBase = (
          growth * 0.44
          + trade * 0.18
          + credit * 0.16
          + tech * 0.12
          + score * 0.10
        );

        const regionalBias: Record<string, number> = {
          northamerica: 4,
          europe: -12,
          russia: -18,
          middleeast: -2,
          africa: 2,
          southasia: 15,
          china: -8,
          japan: -10,
          seasia: 10,
          southamerica: -4,
          australia: 6,
        };

        score = clampScore(growthResilienceBase + (regionalBias[region.id] ?? 0));
      } else if (activeMode === 'trade') {
        // High score = stronger trade-chain resilience / healthier logistics pulse.
        // We blend trade, global risk, energy and growth because trade does not live alone.
        const trade = findScore(categories, 'ticaret', 'tedarik');
        const globalRisk = findScore(categories, 'küresel risk');
        const energy = findScore(categories, 'enerji');
        const growth = findScore(categories, 'büyüme', 'reel ekonomi');

        const tradeResilienceBase = (
          trade * 0.46
          + globalRisk * 0.16
          + energy * 0.16
          + growth * 0.12
          + score * 0.10
        );

        const regionalBias: Record<string, number> = {
          northamerica: 2,
          europe: 4,
          russia: -24,
          middleeast: -2,
          africa: -10,
          southasia: -4,
          china: 8,
          japan: 6,
          seasia: 12,
          southamerica: -6,
          australia: 8,
        };

        score = clampScore(tradeResilienceBase + (regionalBias[region.id] ?? 0));
      } else if (activeMode === 'geo') {
        // High score = lower geopolitical fragility / better shock absorption.
        // We combine political-social stability with macro fragility and energy dependence.
        const globalRisk = findScore(categories, 'küresel risk');
        const social = findScore(categories, 'siyasi', 'sosyal');
        const credit = findScore(categories, 'kredi', 'finansal stres');
        const energy = findScore(categories, 'enerji');

        const geoResilienceBase = (
          globalRisk * 0.34
          + social * 0.24
          + credit * 0.14
          + energy * 0.12
          + score * 0.16
        );

        const regionalBias: Record<string, number> = {
          northamerica: 8,
          europe: -10,
          russia: -34,
          middleeast: -28,
          africa: -18,
          southasia: -10,
          china: -16,
          japan: 2,
          seasia: -8,
          southamerica: 2,
          australia: 12,
        };

        score = clampScore(geoResilienceBase + (regionalBias[region.id] ?? 0));
      }

      scores[region.id] = clampScore(Math.round(score));
    }
    return scores;
  }, [categories, activeMode]);

  const hoveredReg = MAP_REGIONS.find(r => r.id === hoveredRegion);

  const handleRegionClick = (region: MapRegion) => {
    const cat = findCat(categories, ...region.categoryKeywords);
    if (cat) onSelectCategory(cat.id);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
    const rect = e.currentTarget.closest('div')?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  return (
    <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] overflow-hidden">
      {/* Header */}
      <PremiumPanelHeader
        icon={<Globe className="w-4 h-4" />}
        title="Küresel Piyasa Haritası"
        accent="#60A5FA"
      />

      {/* Mode Tabs */}
      <div className="flex gap-px bg-[#0A0A0A] border-b border-[#1A1A1A] overflow-x-auto">
        {MAP_MODES.map(mode => {
          const Icon = MAP_MODE_ICONS[mode.id];
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setActiveMode(mode.id)}
            className="shrink-0 px-3 py-2 text-[11px] font-medium uppercase tracking-wide transition-colors border-b-2 flex items-center gap-1.5"
            style={{
              color: activeMode === mode.id ? MAP_MODE_STYLES[mode.id].text : '#7A7A7A',
              backgroundColor: activeMode === mode.id ? MAP_MODE_STYLES[mode.id].bg : '#0B0B0B',
              borderBottomColor: activeMode === mode.id ? MAP_MODE_STYLES[mode.id].accent : 'transparent',
              boxShadow: activeMode === mode.id
                ? `inset 0 1px 0 ${MAP_MODE_STYLES[mode.id].shadow}, inset 0 -1px 0 ${MAP_MODE_STYLES[mode.id].accent}33, 0 0 0 1px ${MAP_MODE_STYLES[mode.id].accent}1A, 0 8px 18px -14px ${MAP_MODE_STYLES[mode.id].accent}`
                : 'inset 0 -1px 0 rgba(255,255,255,0.02)',
              borderTopLeftRadius: activeMode === mode.id ? '8px' : '0px',
              borderTopRightRadius: activeMode === mode.id ? '8px' : '0px',
            }}
          >
              <Icon
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: activeMode === mode.id ? MAP_MODE_STYLES[mode.id].accent : '#5A5A5A' } as React.CSSProperties}
              />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* SVG Map */}
      <div
        className="relative w-full"
        style={{
          background: 'linear-gradient(180deg, #071522 0%, #07111D 55%, #04090F 100%)',
          aspectRatio: '960 / 500',
        }}
      >
        <svg
          viewBox="0 0 960 500"
          width="100%"
          height="100%"
          style={{ display: 'block' }}
          onMouseMove={handleMouseMove}
        >
          <defs>
            {/* Ocean gradient */}
            <linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#071522" />
              <stop offset="55%" stopColor="#07111D" />
              <stop offset="100%" stopColor="#04090F" />
            </linearGradient>
            <radialGradient id="oceanVignette" cx="50%" cy="46%" r="70%">
              <stop offset="0%" stopColor="rgba(16,34,52,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.34)" />
            </radialGradient>
            <pattern id="oceanGrid" width="80" height="56" patternUnits="userSpaceOnUse">
              <path d="M80 0H0V56" fill="none" stroke="#0D1E30" strokeWidth="0.6" strokeDasharray="4 6" opacity="0.85" />
            </pattern>
            <filter id="mapLandShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.28" />
            </filter>
          </defs>
          {/* Ocean background */}
          <rect width="960" height="500" fill="url(#oceanGrad)" />
          <rect width="960" height="500" fill="url(#oceanVignette)" />
          <rect width="960" height="500" fill="url(#oceanGrid)" opacity="0.9" />

          {/* Equator line */}
          <line x1="0" y1={250} x2="960" y2={250} stroke="#122030" strokeWidth="1" />

          {/* Greenland (non-interactive, grey background landmass) */}
          <path
            d="M288,20 L366,20 L398,40 L408,58 L398,82 L342,82 L318,60 Z"
            fill="#173526"
            fillOpacity={0.45}
            stroke="#2A5A43"
            strokeWidth={0.8}
          />

          {/* Iceland */}
          <path
            d="M396,58 L414,54 L426,62 L418,72 L401,69 Z"
            fill="#173526"
            fillOpacity={0.44}
            stroke="#2A5A43"
            strokeWidth={0.5}
          />

          {/* UK / Ireland */}
          <path
            d="M448,98 L458,92 L468,102 L462,114 L450,109 Z"
            fill="#173526"
            fillOpacity={0.44}
            stroke="#2A5A43"
            strokeWidth={0.5}
          />

          {/* Interactive regions */}
          {MAP_REGIONS.map(region => {
            const score = regionScores[region.id] ?? 50;
            const color = scoreColor(score);
            const isHovered = hoveredRegion === region.id;

            return (
              <g key={region.id}>
                {/* Glow effect on hover */}
                {isHovered && (
                  <path
                    d={region.path}
                    fill={color}
                    fillOpacity={0.25}
                    stroke={color}
                    strokeWidth={6}
                    strokeOpacity={0.2}
                    style={{ pointerEvents: 'none' }}
                  />
                )}
                <path
                  d={region.path}
                  fill={color}
                  fillOpacity={isHovered ? 0.80 : 0.52}
                  stroke={isHovered ? color : '#000000'}
                  strokeWidth={isHovered ? 1.5 : 0.6}
                  strokeOpacity={isHovered ? 1 : 0.5}
                  filter="url(#mapLandShadow)"
                  style={{ cursor: 'pointer', transition: 'fill-opacity 0.15s ease' }}
                  onMouseEnter={() => setHoveredRegion(region.id)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => handleRegionClick(region)}
                />
                {/* Region label */}
                <text
                  x={region.cx}
                  y={region.cy - 10}
                  textAnchor="middle"
                  fill={isHovered ? '#FFFFFF' : '#DDDDDD'}
                  fontSize={region.id === 'russia' ? '13' : region.id === 'northamerica' ? '14' : '12.5'}
                  fontWeight="700"
                  fontFamily="system-ui, sans-serif"
                  style={{
                    pointerEvents: 'none',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,1))',
                    paintOrder: 'stroke fill',
                    stroke: 'rgba(4,10,8,0.92)',
                    strokeWidth: 3.5,
                    strokeLinejoin: 'round',
                  }}
                >
                  {region.label}
                </text>
                {/* Score badge */}
                <text
                  x={region.cx}
                  y={region.cy + 14}
                  textAnchor="middle"
                  fill={color}
                  fontSize="18"
                  fontWeight="bold"
                  fontFamily="monospace"
                  style={{
                    pointerEvents: 'none',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,1))',
                    paintOrder: 'stroke fill',
                    stroke: 'rgba(4,10,8,0.92)',
                    strokeWidth: 3,
                    strokeLinejoin: 'round',
                  }}
                >
                  {regionScores[region.id] ?? '—'}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredReg && (
          <div
            className="absolute pointer-events-none z-10 rounded-sm border border-[#2A2A2A] bg-[#0D0D0D] shadow-xl p-3"
            style={{
              left: Math.min(tooltipPos.x + 12, 760),
              top: Math.max(tooltipPos.y - 100, 4),
              width: '220px',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[12px] font-bold"
                style={{ color: scoreColor(regionScores[hoveredReg.id] ?? 50) }}
              >
                {hoveredReg.label}
              </span>
              <span
                className="ml-auto text-[13px] font-bold font-mono tabular-nums"
                style={{ color: scoreColor(regionScores[hoveredReg.id] ?? 50) }}
              >
                {regionScores[hoveredReg.id] ?? '—'}
              </span>
            </div>
            <div className="text-[10px] text-[#888888] mb-2 font-mono">
              {scoreWord(regionScores[hoveredReg.id] ?? 50)} · {hoveredReg.metrics[activeMode].note}
            </div>
            <div className="space-y-1">
              {hoveredReg.metrics[activeMode].items.map(item => (
                <div key={item} className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-[#60A5FA] shrink-0" />
                  <span className="text-[11px] text-[#B0B0B0]">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-[#1A1A1A] text-[10px] text-[#555555]">
              Tıklayarak ilgili kategoriye git →
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-2 right-3 flex items-center gap-3">
          {[
            { c: '#4ADE80', l: '≥70' },
            { c: '#FBBF24', l: '50–69' },
            { c: '#FB923C', l: '30–49' },
            { c: '#F87171', l: '<30' },
          ].map(item => (
            <span key={item.l} className="flex items-center gap-1 text-[10px] font-mono text-[#666666]">
              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: item.c, opacity: 0.7 }} />
              {item.l}
            </span>
          ))}
        </div>
      </div>

      {/* Region score bars */}
      <div className="grid grid-cols-3 gap-px bg-[#0A0A0A] border-t border-[#1A1A1A]">
        {MAP_REGIONS.map(region => {
          const score = regionScores[region.id] ?? 50;
          const color = scoreColor(score);
          return (
            <button
              key={region.id}
              type="button"
              onClick={() => handleRegionClick(region)}
              onMouseEnter={() => setHoveredRegion(region.id)}
              onMouseLeave={() => setHoveredRegion(null)}
              className="flex items-center gap-2 px-3 py-2 bg-[#0D0D0D] hover:bg-[#141414] transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-[#C0C0C0] font-medium mb-1 truncate">{region.label}</div>
                <div className="h-[3px] bg-[#1A1A1A] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color, opacity: 0.8 }} />
                </div>
              </div>
              <span className="shrink-0 text-[13px] font-bold font-mono tabular-nums" style={{ color }}>{score}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

// Günün Yön Kartı
export function DirectionCard({
  summary,
  score,
  className = '',
}: {
  summary: string | null;
  score: number | null;
  className?: string;
}) {
  const regime = scoreRegime(score);
  const color = scoreColor(score);

  const fallbacks: Record<string, string> = {
    'risk-on': 'Risk iştahı güçlü, momentum yaygın, büyüme cephesi destekleyici. Fon akışları ve piyasa genişliği bu görünümü teyit ediyor. Kısa vadede ana soru, bu iyimserliğin ne kadar tabana yayıldığı ve ne kadar sürdürülebilir olduğudur.',
    'neutral': 'Piyasa nötr ama iç yapı zayıflıyor. Sinyaller karışık. Güçlü görünen alanlarla kırılgan bölgeler aynı anda çalıştığı için yön netleşmiyor. Bu yüzden dengeyi bozabilecek alt metrikler ve yeni veri akışı özellikle önemli hale geliyor.',
    'defensive': 'Savunmacı sinyaller artıyor, büyüme tarafı henüz kırılmadı. Piyasa tamamen stres rejimine geçmemiş olsa da risk alma iştahı seçici hale geliyor. Özellikle likidite, kredi ve büyüme tarafındaki yeni bozulmalar bu görünümü daha da baskılayabilir.',
    'stressed': 'Finansal stres yüksek, kırılganlık belirgin. Savunma öncelikli. Piyasada güvenli liman davranışı ve korunma talebi öne çıkarken riskli alanlar baskı altında kalıyor. Bu aşamada toparlanma için sadece fiyat hareketi değil, temel veri cephesinde de net bir iyileşme görmek gerekiyor.',
    'unknown': 'Veri güncelleniyor, yön değerlendirmesi bekleniyor. Mevcut tablo net bir rejim okuması üretmek için yeterince dolu değil. Yeni veri akışı geldikçe piyasa yönü daha tutarlı biçimde okunabilir hale gelecektir.',
  };

  const addendum: Record<string, string> = {
    'risk-on': 'Likidite desteği ve katılım genişliği korunursa bu yapı daha da güçlenebilir. Yine de aşırı iyimserliğin dar bir liderlikten gelip gelmediği izlenmeli.',
    'neutral': 'Bu nedenle tek bir ana başlığa bakmak yerine güçlü ve zayıf alanların birlikte okunması gerekiyor. Özellikle yönü bozabilecek yeni sapmalar kısa vadede daha belirleyici olabilir.',
    'defensive': 'Bu yapı genelde yatırımcıların seçici davrandığı ve kaliteli alanlara yöneldiği dönemlere benzer. Eğer stres göstergeleri derinleşirse nötr görünümden daha sert bir savunmacı rejime geçiş görülebilir.',
    'stressed': 'Bu rejimde toparlanma sinyali aranırken kredi, volatilite ve likidite tarafı birlikte izlenmeli. Tek bir olumlu veri noktası yerine geniş tabanlı bir sakinleşme daha anlamlı olacaktır.',
    'unknown': 'Şimdilik bu kart bekleme modunda okunmalı. Veri kapsaması arttıkça yön yorumu da daha anlamlı hale gelecektir.',
  };

  const text = summary ? `${summary} ${addendum[regime]}` : fallbacks[regime];

  return (
    <div
      className={`relative rounded-sm border overflow-hidden h-full ${className}`}
      style={{ borderColor: scoreBorder(score), backgroundColor: scoreBg(score) }}
    >
      <div className="absolute inset-x-0 top-0 h-[2px]" style={{ backgroundColor: color }} />
      <div className="px-5 py-4 h-full flex flex-col">
        <div className="text-[11px] font-mono uppercase tracking-[0.15em] mb-2" style={{ color }}>
          Günün Piyasa Yönü · <span style={{ color }}>{scoreWord(score)}</span>
        </div>
        <p className="text-[14px] text-[#D4D4D4] leading-relaxed font-medium">
          {text}
        </p>
      </div>
    </div>
  );
}

// "Bugün Nereden Başlamalıyım?" card
function StartHereCard({
  categories,
  alerts,
  onSelectCategory,
}: {
  categories: DashboardData['categories'];
  alerts: DashboardData['alerts'];
  onSelectCategory: (id: string) => void;
}) {
  const priorities = useMemo(() => {
    const alertMessages = alerts.map(a => a.message.toLowerCase());

    return categories
      .filter(c => c.score !== null)
      .map(c => {
        const s = c.score!;
        const change = c.change7d ?? 0;
        const hasAlert = alertMessages.some(m =>
          c.name.split(' ').some(word => word.length > 3 && m.includes(word.toLowerCase()))
        );
        let priority = s;
        if (change < -5) priority -= 8;
        if (hasAlert) priority -= 15;
        return { ...c, priority, hasAlert, change };
      })
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3);
  }, [categories, alerts]);

  return (
    <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] overflow-hidden">
      <PremiumPanelHeader
        icon={<Eye className="w-4 h-4" />}
        title="Bugün Nereden Başlamalıyım?"
        accent="#38BDF8"
      />
      <div className="divide-y divide-[#1A1A1A]">
        {priorities.length === 0 ? (
          <div className="px-4 py-6 text-[13px] text-[#555555] font-mono">Veri bekleniyor...</div>
        ) : (
          priorities.map((cat, i) => {
            const color = scoreColor(cat.score);
            const bg = scoreBg(cat.score);
            const reasons: string[] = [];
            if ((cat.score ?? 100) < 35) reasons.push('kritik bölgede');
            else if ((cat.score ?? 100) < 50) reasons.push('baskı altında');
            if (cat.change < -5) reasons.push(`${Math.abs(Math.round(cat.change))} puan geriledi`);
            if (cat.hasAlert) reasons.push('aktif uyarı var');
            if (reasons.length === 0) reasons.push('yakından izlenmeyi hak ediyor');

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#141414] group"
              >
                <div
                  className="shrink-0 w-7 h-7 rounded-sm flex items-center justify-center text-[11px] font-bold font-mono"
                  style={{ backgroundColor: bg, color, border: `1px solid ${color}40` }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-medium text-[#D4D4D4] group-hover:text-[#F5F5F5] transition-colors leading-snug">
                      {cat.name}
                    </span>
                    <span className="text-[13px] font-bold font-mono tabular-nums" style={{ color }}>
                      {cat.score !== null ? Math.round(cat.score) : '—'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#777777] mt-0.5">
                    {reasons.join(' · ')}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#444444] group-hover:text-[#888888] transition-colors mt-0.5 shrink-0" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// Kategori Isı Haritası — full category names
function CategoryHeatmap({
  categories,
  visiblePlaceholders,
  onSelectCategory,
}: {
  categories: DashboardData['categories'];
  visiblePlaceholders: [string, string][];
  onSelectCategory: (id: string) => void;
}) {
  return (
    <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] overflow-hidden">
      <PremiumPanelHeader
        icon={<Activity className="w-4 h-4" />}
        title="Kategori Isı Haritası"
        accent="#F59E0B"
        right={
          <div className="flex items-center gap-3">
          {[{ c: '#4ADE80', l: '≥70' }, { c: '#FBBF24', l: '50–69' }, { c: '#FB923C', l: '30–49' }, { c: '#F87171', l: '<30' }].map(item => (
            <span key={item.l} className="flex items-center gap-1 text-[10px] font-mono text-[#666666]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.c }} />
              {item.l}
            </span>
          ))}
          </div>
        }
      />
      <div className="grid grid-cols-6 gap-px bg-[#0A0A0A]">
        {categories.map(cat => {
          const score = cat.score !== null ? Math.round(cat.score) : null;
          const color = scoreColor(cat.score);
          const bg = scoreBg(cat.score);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className="flex flex-col items-start p-3 text-left transition-all hover:brightness-125 relative"
              style={{ backgroundColor: bg, minHeight: '84px' }}
            >
              <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ backgroundColor: color, opacity: 0.3 }}>
                <div className="h-full" style={{ width: `${score ?? 0}%`, backgroundColor: color }} />
              </div>
              <div
                className="text-[10px] font-medium leading-tight mb-2 w-full"
                style={{ color: cat.score !== null ? color : '#3A3A3A' }}
              >
                {cat.name}
              </div>
              <div className="flex items-end justify-between w-full mt-auto">
                <span
                  className="text-[20px] font-bold font-mono tabular-nums leading-none"
                  style={{ color: cat.score !== null ? color : '#2A2A2A' }}
                >
                  {score ?? '—'}
                </span>
                {cat.change7d !== null && (
                  <span
                    className="text-[10px] font-mono mb-0.5"
                    style={{ color: cat.change7d > 0 ? '#4ADE80' : cat.change7d < 0 ? '#F87171' : '#555555' }}
                  >
                    {cat.change7d > 0 ? '+' : ''}{Math.round(cat.change7d)}
                  </span>
                )}
              </div>
            </button>
          );
        })}
        {visiblePlaceholders.slice(0, Math.max(0, 6 - (categories.length % 6 || 6))).map(([id, name]) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelectCategory(id)}
            className="flex flex-col items-start p-3 text-left bg-[#0A0A0A] hover:bg-[#0D0D0D] transition-colors"
            style={{ minHeight: '84px' }}
          >
            <div className="text-[10px] font-medium leading-tight text-[#2A2A2A]">{name}</div>
            <div className="text-[20px] font-bold font-mono text-[#1F1F1F] mt-auto">—</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Yukarı / Aşağı Çekenler — full-width fill design
function ContributorsPanel({ categories }: { categories: DashboardData['categories'] }) {
  const scored = useMemo(
    () => categories.filter(c => c.score !== null).sort((a, b) => Number(b.score) - Number(a.score)),
    [categories]
  );
  const top8 = scored.slice(0, 8);
  const bottom8 = [...scored].reverse().slice(0, 8);
  const avg = scored.length > 0
    ? Math.round(scored.reduce((s, c) => s + (c.score ?? 0), 0) / scored.length)
    : null;

  return (
    <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] overflow-hidden flex flex-col">
      <PremiumPanelHeader
        icon={<Zap className="w-4 h-4" />}
        title="Yukarı / Aşağı Çekenler"
        accent="#FBBF24"
        right={
          avg !== null ? (
            <span className="text-[11px] font-mono text-[#888888]">
              Ortalama:&nbsp;
              <span className="font-bold" style={{ color: scoreColor(avg) }}>{avg}</span>
            </span>
          ) : undefined
        }
      />

      <div className="flex-1 grid grid-cols-2 divide-x divide-[#1A1A1A]">
        {/* Sol: Güçlü Alanlar */}
        <div className="flex flex-col">
          <div className="px-4 py-2 border-b border-[#1A1A1A] bg-[#0D1A0D]">
            <span className="text-[11px] font-mono text-[#4ADE80] uppercase tracking-wider font-semibold">
              Güçlü Alanlar ↑
            </span>
          </div>
          <div className="flex-1 divide-y divide-[#141414]">
            {top8.map((cat, i) => {
              const pct = ((cat.score ?? 0) / 100) * 100;
              return (
                <div key={cat.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-[10px] font-mono text-[#444444] w-3 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-[#C0C0C0] font-medium truncate mb-1.5">{cat.name}</div>
                    <div className="h-[5px] bg-[#0D0D0D] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: '#4ADE80', opacity: 0.75 }}
                      />
                    </div>
                  </div>
                  <span className="text-[13px] font-bold font-mono tabular-nums text-[#4ADE80] shrink-0 w-7 text-right">
                    {Math.round(cat.score!)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sağ: Zayıf Alanlar */}
        <div className="flex flex-col">
          <div className="px-4 py-2 border-b border-[#1A1A1A] bg-[#1A0D0D]">
            <span className="text-[11px] font-mono text-[#F87171] uppercase tracking-wider font-semibold">
              Zayıf Alanlar ↓
            </span>
          </div>
          <div className="flex-1 divide-y divide-[#141414]">
            {bottom8.map((cat, i) => {
              const pct = ((cat.score ?? 0) / 100) * 100;
              return (
                <div key={cat.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-[10px] font-mono text-[#444444] w-3 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-[#C0C0C0] font-medium truncate mb-1.5">{cat.name}</div>
                    <div className="h-[5px] bg-[#0D0D0D] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: '#F87171', opacity: 0.75 }}
                      />
                    </div>
                  </div>
                  <span className="text-[13px] font-bold font-mono tabular-nums text-[#F87171] shrink-0 w-7 text-right">
                    {Math.round(cat.score!)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Rejim Radar
function RegimeRadar({ categories }: { categories: DashboardData['categories'] }) {
  const radarData = useMemo(() => {
    const buyume = findScore(categories, 'büyüme', 'reel ekonomi');
    const likidite = findScore(categories, 'likidite');
    const riskIstahi = findScore(categories, 'etf', 'sermaye');
    const finansalStres = 100 - findScore(categories, 'kredi', 'finansal stres');
    const enflasyon = 100 - findScore(categories, 'enflasyon');
    const siyasiRisk = 100 - findScore(categories, 'küresel', 'jeopolitik', 'siyasi');

    return [
      { axis: 'Büyüme', value: Math.round(buyume) },
      { axis: 'Likidite', value: Math.round(likidite) },
      { axis: 'Risk İştahı', value: Math.round(riskIstahi) },
      { axis: 'Düşük Stres', value: Math.round(finansalStres) },
      { axis: 'Düşük Enflasyon', value: Math.round(enflasyon) },
      { axis: 'Siyasi İstikrar', value: Math.round(siyasiRisk) },
    ];
  }, [categories]);

  return (
    <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] overflow-hidden">
      <PremiumPanelHeader
        icon={<Map className="w-4 h-4" />}
        title="Rejim Radar"
        accent="#60A5FA"
        right={<span className="text-[10px] font-mono text-[#666666]">6 eksen · 0–100</span>}
      />
      <div className="p-4">
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={radarData} margin={{ top: 16, right: 40, bottom: 16, left: 40 }}>
            <PolarGrid stroke="#1F1F1F" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: '#999999', fontSize: 11, fontFamily: 'monospace' }}
            />
            <Radar
              name="Rejim"
              dataKey="value"
              stroke="#60A5FA"
              fill="#60A5FA"
              fillOpacity={0.15}
              strokeWidth={1.5}
              dot={{ r: 3, fill: '#60A5FA', strokeWidth: 0 }}
            />
          </RadarChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-3 gap-2 mt-2 border-t border-[#1A1A1A] pt-3">
          {radarData.map(item => (
            <div key={item.axis} className="text-center">
              <div className="text-[10px] font-mono text-[#777777] mb-0.5">{item.axis}</div>
              <div className="text-[16px] font-bold font-mono tabular-nums" style={{ color: scoreColor(item.value) }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// İnceleme Akışı — full category names
function ReadingFlow({
  totalScore,
  categories,
  onSelectCategory,
}: {
  totalScore: number | null;
  categories: DashboardData['categories'];
  onSelectCategory: (id: string) => void;
}) {
  const regime = scoreRegime(totalScore);
  const flow = REGIME_FLOWS[regime];

  const resolvedItems = useMemo(() => {
    return flow.keywords.map(kwGroup => {
      const cat = categories.find(c =>
        kwGroup.some(kw => c.name.toLowerCase().includes(kw.toLowerCase()))
      );
      return { kwGroup, cat };
    });
  }, [flow.keywords, categories]);

  return (
    <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] overflow-hidden">
      <PremiumPanelHeader
        icon={<BookOpen className="w-4 h-4" />}
        title="İnceleme Akışı"
        accent={flow.color}
        right={
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-sm border"
            style={{ color: flow.color, borderColor: flow.color + '40', backgroundColor: flow.color + '12' }}
          >
            {flow.label}
          </span>
        }
      />
      <div className="p-4">
        <p className="text-[12px] text-[#888888] leading-relaxed mb-4">{flow.desc}</p>
        {resolvedItems.length === 0 ? (
          <div className="text-[13px] text-[#444444] font-mono">Veri bekleniyor.</div>
        ) : (
          <div className="space-y-1.5">
            {resolvedItems.map(({ kwGroup, cat }, i) => (
              <button
                key={kwGroup[0]}
                type="button"
                onClick={() => cat && onSelectCategory(cat.id)}
                className={`w-full flex items-center gap-3 rounded-sm px-3 py-2.5 text-left transition-colors ${cat ? 'hover:bg-[#141414] cursor-pointer' : 'cursor-default'}`}
              >
                <span
                  className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono bg-[#1A1A1A]"
                  style={{ color: flow.color }}
                >
                  {i + 1}
                </span>
                <span className="flex-1 text-[13px] text-[#C0C0C0] text-left">
                  {cat ? cat.name : kwGroup[0]}
                </span>
                {cat && (
                  <span className="shrink-0 text-[13px] font-mono font-bold tabular-nums" style={{ color: scoreColor(cat.score) }}>
                    {cat.score !== null ? Math.round(cat.score) : '—'}
                  </span>
                )}
                {cat && <ArrowRight className="w-3.5 h-3.5 text-[#444444] shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Bölgesel Risk Görünümü — fills the full block
function RegionalRiskMap({ categories }: { categories: DashboardData['categories'] }) {
  const regions = useMemo(() => {
    const fedScore = findScore(categories, 'fed', 'para politikası');
    const reelScore = findScore(categories, 'büyüme', 'reel ekonomi');
    const enflScore = findScore(categories, 'enflasyon');
    const globalRisk = findScore(categories, 'küresel', 'jeopolitik');
    const emScore = findScore(categories, 'gelişmekte');
    const ticaret = findScore(categories, 'ticaret', 'tedarik');
    const enerji = findScore(categories, 'enerji');

    return [
      { name: 'Amerika', flag: '🇺🇸', score: Math.round((fedScore + reelScore + enflScore) / 3), drivers: ['Fed politikası', 'İstihdam', 'Enflasyon'] },
      { name: 'Avrupa', flag: '🇪🇺', score: Math.round((globalRisk + ticaret) / 2), drivers: ['Jeopolitik risk', 'Ticaret', 'Enerji bağımlılığı'] },
      { name: 'Çin / Asya', flag: '🇨🇳', score: Math.round((emScore + ticaret) / 2), drivers: ['Deflasyon riski', 'Tedarik zinciri', 'Ticaret gerilimi'] },
      { name: 'Enerji Bölgeleri', flag: '⛽', score: Math.round(enerji), drivers: ['Petrol / Gaz üretimi', 'OPEC kararları', 'Arz riski'] },
      { name: 'Gelişmekte Olan Piyasalar', flag: '🌍', score: Math.round(emScore), drivers: ['Döviz baskısı', 'Sermaye akışları', 'Dış borç'] },
    ];
  }, [categories]);

  return (
    <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] overflow-hidden flex flex-col">
      <PremiumPanelHeader
        icon={<Map className="w-4 h-4" />}
        title="Bölgesel Risk Görünümü"
        accent="#FB923C"
      />
      <div className="flex-1 flex flex-col divide-y divide-[#141414]">
        {regions.map(region => {
          const color = scoreColor(region.score);
          const bg = scoreBg(region.score);
          const border = scoreBorder(region.score);
          return (
            <div
              key={region.name}
              className="flex items-center gap-4 px-4 py-3 flex-1"
              style={{ backgroundColor: bg + 'AA', borderLeft: `3px solid ${color}` }}
            >
              <div className="text-2xl shrink-0">{region.flag}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[#D4D4D4] mb-1">{region.name}</div>
                <div className="text-[11px] text-[#888888] leading-snug">
                  {region.drivers.join(' · ')}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[22px] font-bold font-mono tabular-nums leading-none" style={{ color }}>
                  {region.score}
                </div>
                <div className="text-[10px] font-mono mt-0.5" style={{ color }}>
                  {scoreWord(region.score)}
                </div>
              </div>
              <div className="w-24 shrink-0">
                <div className="h-[5px] bg-[#1A1A1A] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${region.score}%`, backgroundColor: color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export function HomePage({
  totalScore,
  totalScoreChange7d,
  totalScoreTrend,
  loading,
  categories,
  alerts,
  divergences,
  homeInsight,
  homeSimpleSummary,
  marketDirectionSummary,
  homeConfidence,
  visiblePlaceholders,
  onSelectCategory,
  totalFetchedMetrics,
  totalTrackedMetrics,
  showDirectionCard = true,
  watchlist = [],
  onRemoveFromWatchlist,
}: HomePageProps) {
  const scoredCategories = categories.filter(c => c.score !== null);
  const regime = scoreRegime(totalScore);
  const regimeFlow = REGIME_FLOWS[regime];
  const color = scoreColor(totalScore);

  return (
    <div className="space-y-4">
      {/* ─── Günün Yön Kartı ─────────────────────────────── */}
      {showDirectionCard && (
        <DirectionCard summary={marketDirectionSummary ?? homeSimpleSummary} score={totalScore} />
      )}

      {/* ─── Yapay Zeka Piyasa Yorumu ────────────────────── */}
      {(loading || homeInsight || homeSimpleSummary) && (
        <div className="relative rounded-sm border border-[#1A3A1A] bg-[#0A1A0A] overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-[#4ADE80]" />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse shrink-0" />
              <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#4ADE80]">Mergen Intelligent Yorumu</span>
              {homeConfidence !== null && (
                <span className="ml-auto text-[10px] font-mono text-[#4A8A4A] border border-[#1A3A1A] px-2 py-0.5 rounded-sm">
                  güven {homeConfidence}/5
                </span>
              )}
            </div>
            {loading && !homeInsight ? (
              <div className="flex items-center gap-3 text-[13px] text-[#7FB08A]">
                <span className="inline-block h-3 w-3 rounded-full border-2 border-[#245A2E] border-t-[#4ADE80] animate-spin shrink-0" />
                <span className="leading-relaxed">Mergen Intelligent Yorumu yükleniyor. Genel piyasa özeti hazırlanıyor...</span>
              </div>
            ) : (
              <p className="text-[13px] text-[#B0B0B0] leading-relaxed">
                {homeInsight ?? 'Bu alan için henüz yorum oluşmadı. Veri akışı tamamlandığında özet burada görünecek.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ─── Watchlist ───────────────────────────────────── */}
      {watchlist.length > 0 && (
        <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] overflow-hidden">
          <PremiumPanelHeader
            icon={<Star className="w-4 h-4" />}
            title="İzleme Listesi"
            accent="#FBBF24"
            right={<span className="text-[11px] text-[#666666] font-mono">{watchlist.length} metrik</span>}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1A1A1A]">
            {watchlist.map((item) => (
              <div key={item.symbol} className="bg-[#111111] px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-[#D4D4D4] truncate">{item.name}</div>
                  <div className="text-[10px] text-[#555555] uppercase tracking-wider mt-0.5">{item.categoryName}</div>
                </div>
                <div className="shrink-0 text-right">
                  {item.latestValue !== null ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-mono font-semibold text-[#D4D4D4]">
                        {item.latestValue % 1 === 0 ? item.latestValue.toFixed(0) : item.latestValue.toFixed(2)}
                      </span>
                      {item.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-[#4ADE80]" />}
                      {item.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-[#F87171]" />}
                      {item.trend === 'flat' && <Minus className="w-3.5 h-3.5 text-[#555555]" />}
                    </div>
                  ) : (
                    <span className="text-[13px] font-mono text-[#444444]">—</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveFromWatchlist?.(item.symbol)}
                  className="shrink-0 text-[#333333] hover:text-[#888888] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Row: Start Here + Mergen Stats ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        <StartHereCard categories={categories} alerts={alerts} onSelectCategory={onSelectCategory} />

        {/* Mergen Index Stats */}
        <div className="rounded-sm border overflow-hidden relative" style={{ borderColor: scoreBorder(totalScore), backgroundColor: scoreBg(totalScore) }}>
          <div className="absolute inset-x-0 top-0 h-[2px]" style={{ backgroundColor: color }} />
          <div className="p-5">
            <div className="text-[11px] font-mono uppercase tracking-[0.15em] mb-3" style={{ color }}>
              Mergen Endeksi
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-[44px] font-bold font-mono tabular-nums leading-none" style={{ color }}>
                {totalScore ?? '—'}
              </span>
              <span className="text-[14px] text-[#555555] font-mono">/100</span>
              {totalScoreTrend === 'up' && <TrendingUp className="w-5 h-5 text-[#4ADE80] mb-1" />}
              {totalScoreTrend === 'down' && <TrendingDown className="w-5 h-5 text-[#F87171] mb-1" />}
              {totalScoreTrend === 'flat' && <Minus className="w-5 h-5 text-[#666666] mb-1" />}
            </div>
            <div className="h-[4px] bg-[#1A1A1A] rounded-full mb-4 mt-2">
              <div className="h-full rounded-full" style={{ width: `${totalScore ?? 0}%`, backgroundColor: color, opacity: 0.7 }} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-[11px] mb-4">
              <div>
                <div className="text-[#666666] font-mono mb-0.5">7 Günlük Değişim</div>
                <div className="font-mono font-bold text-[13px]" style={{ color: totalScoreChange7d !== null ? (totalScoreChange7d > 0 ? '#4ADE80' : totalScoreChange7d < 0 ? '#F87171' : '#888888') : '#555555' }}>
                  {totalScoreChange7d !== null ? `${totalScoreChange7d > 0 ? '+' : ''}${totalScoreChange7d.toFixed(1)}` : '—'}
                </div>
              </div>
              <div>
                <div className="text-[#666666] font-mono mb-0.5">Rejim</div>
                <div className="font-mono font-bold text-[12px]" style={{ color: regimeFlow.color }}>
                  {regimeFlow.label}
                </div>
              </div>
              <div>
                <div className="text-[#666666] font-mono mb-0.5">Aktif Kategoriler</div>
                <div className="font-mono font-bold text-[13px] text-[#AAAAAA]">{scoredCategories.length}</div>
              </div>
              <div>
                <div className="text-[#666666] font-mono mb-0.5">Kapsama Oranı</div>
                <div className="font-mono font-bold text-[13px] text-[#AAAAAA]">
                  %{totalTrackedMetrics > 0 ? Math.round((totalFetchedMetrics / totalTrackedMetrics) * 100) : 0}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-px overflow-hidden rounded-sm border border-[#1A1A1A]">
              {[
                { label: 'Risk-On', min: 75, max: 100, c: '#4ADE80' },
                { label: 'Nötr', min: 55, max: 74, c: '#FBBF24' },
                { label: 'Savunmacı', min: 35, max: 54, c: '#FB923C' },
                { label: 'Stresli', min: 0, max: 34, c: '#F87171' },
              ].map(band => {
                const active = totalScore !== null && totalScore >= band.min && totalScore <= band.max;
                return (
                  <div
                    key={band.label}
                    className="py-2 text-center text-[10px] font-mono font-semibold transition-all"
                    style={{ color: active ? band.c : '#333333', backgroundColor: active ? band.c + '18' : '#0D0D0D' }}
                  >
                    {band.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Kategori Isı Haritası ───────────────────────── */}
      <CategoryHeatmap
        categories={categories}
        visiblePlaceholders={visiblePlaceholders}
        onSelectCategory={onSelectCategory}
      />

      {/* ─── Küresel Piyasa Haritası ─────────────────────── */}
      <WorldMap categories={categories} onSelectCategory={onSelectCategory} />

      {/* ─── Row: Contributors + Radar ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4">
        <ContributorsPanel categories={categories} />
        <RegimeRadar categories={categories} />
      </div>

      {/* ─── Row: Reading Flow + Regional Risk ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReadingFlow totalScore={totalScore} categories={categories} onSelectCategory={onSelectCategory} />
        <RegionalRiskMap categories={categories} />
      </div>

      {/* ─── Son Sapmalar ────────────────────────────────── */}
      <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] overflow-hidden">
        <PremiumPanelHeader
          icon={<Activity className="w-4 h-4" />}
          title="Son Sapmalar"
          accent="#A78BFA"
        />
        <div className="p-3">
          {divergences.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {divergences.slice(0, 6).map(item => (
                <div key={item.id} className="rounded-sm border border-[#1A1A1A] bg-[#0D0D0D] px-3 py-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${item.severity === 'high' ? 'bg-[#F87171]' : 'bg-[#FBBF24]'}`} />
                    <div>
                      <div className="text-[12px] font-semibold text-[#D4D4D4] mb-0.5">{item.title}</div>
                      <div className="text-[11px] text-[#888888] leading-relaxed">{item.summary}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-[13px] text-[#555555] font-mono text-center">
              Belirgin sapma sinyali yok.
            </div>
          )}
        </div>
      </div>

      {/* ─── Yasal Uyarı ─────────────────────────────────── */}
      <div className="rounded-sm border border-[#1A1A1A] bg-[#0A0A0A] px-5 py-4">
        <p className="text-[11px] text-[#555555] leading-relaxed">
          <span className="font-semibold text-[#666666]">MERGEN INTELLIGENCE</span>, makroekonomik ve yapısal sinyalleri izlemek için tasarlanmış bir izleme panelidir.
          Buradaki skorlar, yorumlar ve metrik açıklamaları yalnızca bilgi amaçlıdır; yatırım tavsiyesi, finansal danışmanlık,
          hukuki görüş veya resmi politika yönlendirmesi yerine geçmez.
        </p>
      </div>
    </div>
  );
}

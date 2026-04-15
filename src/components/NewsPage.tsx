import React, { useState, useMemo } from 'react';
import { AlertTriangle, ExternalLink, Zap, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import type { DashboardData } from '../hooks/useDashboardData';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type NewsItem = {
  id: string;
  title: string;
  link: string;
  publishedAt: string | null;
  tier: 'critical' | 'daily' | 'other';
};

type MacroKeyword = {
  term: string;
  pattern: RegExp;
  description: string;
  relatedCategory: string;
};

type CorrelationPair = {
  id: string;
  label: string;
  patternA: RegExp;
  patternB: RegExp;
  description: string;
  severity: 'high' | 'medium';
};

// ─────────────────────────────────────────────────────────────
// KNOWLEDGE BASE
// ─────────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Kredi ve Finansal Stres': ['kredi', 'spread', 'credit', 'tahvil', 'bond', 'high-yield', 'cds', 'default', 'temerrüt'],
  'Piyasa Likiditesi': ['likidite', 'liquidity', 'repo', 'tga', 'bilanço', 'm2', 'para arzı', 'rezerv', 'fed balance'],
  'Reel Ekonomi ve Büyüme': ['büyüme', 'gdp', 'gsyh', 'istihdam', 'nfp', 'imalat', 'pmi', 'işsizlik', 'resesyon', 'recession'],
  'Enflasyon Baskıları': ['enflasyon', 'inflation', 'cpi', 'ppi', 'tüfe', 'fiyat endeksi', 'çekirdek'],
  'Küresel Riskler': ['jeopolitik', 'geopolitical', 'savaş', 'rusya', 'iran', 'çatışma', 'nato', 'embargo', 'kriz'],
  'Siyasi ve Sosyal İstikrar': ['seçim', 'siyasi', 'kongre', 'hükümet', 'protesto', 'sosyal güven'],
  'Teknoloji ve Yapısal Dönüşüm': ['yapay zeka', 'ai', 'nvidia', 'teknoloji', 'chip', 'çip', 'semiconductor', 'microsoft', 'apple'],
  'Fed İçi Güç Dengesi': ['fed', 'powell', 'fomc', 'merkez bankası', 'para politikası', 'hawkish', 'dovish', 'güvercin', 'şahin'],
  'ETF ve Sermaye Akışı': ['etf', 'fon akış', 'sermaye akış', 'positioning', 'fund flow'],
  'Değerli Metaller': ['altın', 'gümüş', 'gold', 'silver', 'platin', 'bakır', 'precious'],
  'Tarımsal Emtia ve Gıda Güvenliği': ['buğday', 'mısır', 'soya', 'tarım', 'gıda', 'kuraklık', 'hasat', 'wheat', 'corn'],
  'Enerji ve Enerji Güvenliği': ['petrol', 'doğalgaz', 'opec', 'brent', 'wti', 'enerji', 'oil', 'gas', 'lng'],
  'Döviz ve Kur Dinamikleri': ['dolar', 'euro', 'yen', 'yuan', 'sterlin', 'kur', 'döviz', 'dxy', 'currency'],
  'Kamu Maliyesi ve Sovereign Borç': ['bütçe açık', 'kamu borç', 'hazine tahvil', 'fiscal', 'deficit', 'sovereign'],
  'Gelişmekte Olan Piyasalar': ['gelişmekte', 'emerging', 'brezilya', 'hindistan', 'türkiye', 'em piyasa'],
  'Kripto Para Piyasaları': ['bitcoin', 'btc', 'ethereum', 'eth', 'kripto', 'crypto', 'blockchain', 'altcoin'],
  'Polymarket / Kalshi Tahmin Piyasaları': ['polymarket', 'kalshi', 'tahmin piyasa', 'olasılık', 'probability'],
  'Volatilite ve Türev Piyasaları': ['vix', 'volatilite', 'opsiyon', 'türev', 'implied vol'],
  'Konut ve Gayrimenkul': ['konut', 'gayrimenkul', 'mortgage', 'kira', 'housing', 'real estate'],
  'Piyasa Genişliği ve Pozisyonlanma': ['breadth', 'advance-decline', 'small cap', 'rsp', 'piyasa genişliği'],
  'İşgücü ve Ücret Dinamikleri': ['ücret artış', 'işgücü', 'istihdam maliyet', 'grev', 'labour cost'],
  'Küresel Ticaret ve Tedarik Zinciri': ['tarife', 'tariff', 'tedarik zincir', 'ticaret savaş', 'supply chain', 'ithalat', 'ihracat'],
};

const NEGATIVE_WORDS = ['düş', 'geril', 'kriz', 'resesyon', 'recession', 'baskı', 'endişe', 'korku', 'daralma', 'zarar', 'kayıp', 'crash', 'collapse', 'warning', 'alarm', 'fail', 'weak', 'slow', 'decline', 'drop', 'fall', 'plunge', 'slump', 'contract', 'deteriorat', 'risk artı', 'tehdit'];
const POSITIVE_WORDS = ['yüksel', 'artış', 'büyüme', 'güçlen', 'rally', 'toparlanma', 'iyileş', 'pozitif', 'kazanç', 'surge', 'soar', 'rise', 'gain', 'recover', 'improve', 'strong', 'boost', 'beat', 'exceed', 'outperform', 'expand'];
const SMART_MONEY_WORDS = ['yield curve', 'spread', 'pozisyonlanma', 'kredi koşul', 'repo', 'tga', 'bilanço', 'kurumsal', 'hedge', 'structural', 'liquidity', 'flow', 'positioning'];
const RETAIL_WORDS = ['bitcoin', 'kripto', 'zirve', 'dip', 'fomo', 'panik', 'crash', 'moon', 'pump', 'dump', 'mania', 'retail'];

const MACRO_KEYWORDS: MacroKeyword[] = [
  { term: 'Fed Bilançosu', pattern: /fed.bilanço|federal reserve balance|walcl/i, description: 'Fed\'in toplam varlıkları. QT/QE döngüsünü takip eder — piyasa likiditesinin temel kaynağı.', relatedCategory: 'Piyasa Likiditesi' },
  { term: 'TGA', pattern: /\btga\b|hazine genel hesab/i, description: 'Hazine Genel Hesabı. TGA yükselince sistemden likidite çekilir, düşünce serbest kalır.', relatedCategory: 'Piyasa Likiditesi' },
  { term: 'REPO / RRP', pattern: /\brepo\b|\brRP\b|ters repo|reverse repo/i, description: 'Fed gecelik geri alım işlemleri. Piyasadaki fazla likiditenin barometresi.', relatedCategory: 'Piyasa Likiditesi' },
  { term: 'Yield Curve', pattern: /yield curve|getiri eğris|10y2y|inversiyon/i, description: 'Uzun-kısa vadeli faiz farkı. Inversiyon tarihi olarak resesyonun öncü göstergesi.', relatedCategory: 'Reel Ekonomi ve Büyüme' },
  { term: 'VIX', pattern: /\bvix\b/i, description: 'CBOE Volatilite Endeksi. "Korku ölçeri." 30 üzeri stres bölgesi, 20 altı görece sakinlik.', relatedCategory: 'Volatilite ve Türev Piyasaları' },
  { term: 'FOMC', pattern: /\bfomc\b/i, description: 'Federal Açık Piyasa Komitesi. Fed\'in faiz kararlarını alan organı. Yılda 8 toplantı.', relatedCategory: 'Fed İçi Güç Dengesi' },
  { term: 'QT', pattern: /\bqt\b|quantitative tightening|kantitatif sıkılaştırma/i, description: 'Niceliksel Sıkılaştırma. Fed bilançosunun küçültülmesi — likidite çekilmesi.', relatedCategory: 'Piyasa Likiditesi' },
  { term: 'QE', pattern: /\bqe\b|quantitative easing|kantitatif genişleme/i, description: 'Niceliksel Genişleme. Fed varlık alımı — piyasaya likidite enjeksiyonu.', relatedCategory: 'Piyasa Likiditesi' },
  { term: 'DXY', pattern: /\bdxy\b|dolar endeksi/i, description: 'Dolar Endeksi. Doların 6 büyük para birimine karşı değeri. EM ve emtia fiyatlarını doğrudan etkiler.', relatedCategory: 'Döviz ve Kur Dinamikleri' },
  { term: 'Çekirdek PCE', pattern: /çekirdek pce|core pce|pcepilfe/i, description: 'Fed\'in tercih ettiği enflasyon ölçümü. CPI\'dan farklı olarak enerji/gıdayı dışarıda bırakır.', relatedCategory: 'Enflasyon Baskıları' },
  { term: 'Net Likidite', pattern: /net likidite|net liquidity/i, description: 'Fed Bilançosu − TGA − RRP. Gerçek piyasa likiditesini ölçen bileşik gösterge.', relatedCategory: 'Piyasa Likiditesi' },
  { term: 'Kredi Spread', pattern: /kredi spread|credit spread|high.yield spread|baml/i, description: 'Şirket tahvilleri ile devlet tahvilleri arasındaki faiz farkı. Açılması risk iştahının azaldığına işaret eder.', relatedCategory: 'Kredi ve Finansal Stres' },
];

const CORRELATION_PAIRS: CorrelationPair[] = [
  {
    id: 'gold-real-rate',
    label: 'Altın ↑ + Reel Faiz ↑',
    patternA: /(altın|gold).{0,40}(yüksel|artış|surge|rise)|(yüksel|artış|surge|rise).{0,40}(altın|gold)/i,
    patternB: /(reel faiz|real yield|treasury yield|tahvil faiz).{0,40}(yüksel|rise)|(yüksel|rise).{0,40}(reel faiz|real yield|treasury yield)/i,
    description: 'Altın-Reel Faiz ters korelasyonu bozuluyor. Normalde reel faiz yükselince altın düşer; ikisi birlikte yükseliyorsa olağandışı bir güvenli liman veya rezerv talebi sinyali.',
    severity: 'high',
  },
  {
    id: 'spy-credit-stress',
    label: 'Hisse ↑ + Kredi Spread ↑',
    patternA: /(spy|s&p 500|borsa|hisse|endeks|stock).{0,40}(yüksel|rally|rise|surge)|(yüksel|rally|rise|surge).{0,40}(borsa|hisse|endeks|stock)/i,
    patternB: /(spread|high.yield|kredi spread).{0,40}(yüksel|açıl|widen|rise)|(yüksel|açıl|widen|rise).{0,40}(spread|high.yield|kredi spread)/i,
    description: 'Hisse-Kredi ayrışması. Hisseler yükselirken kredi spread açılması risk iştahıyla çelişiyor — ralli kırılgan olabilir.',
    severity: 'high',
  },
  {
    id: 'dolar-gold',
    label: 'Dolar ↑ + Altın ↑',
    patternA: /(dolar|dxy|dollar|usd).{0,40}(yüksel|güçlen|rise|strengthen)|(yüksel|güçlen|rise|strengthen).{0,40}(dolar|dxy|dollar|usd)/i,
    patternB: /(altın|gold).{0,40}(yüksel|artış|surge|rise)|(yüksel|artış|surge|rise).{0,40}(altın|gold)/i,
    description: 'Dolar-Altın ters korelasyonu bozuluyor. İkisi de yükseliyorsa olağandışı bir güvenli liman talebi veya rezerv çeşitlendirmesi sinyali.',
    severity: 'medium',
  },
  {
    id: 'oil-inflation',
    label: 'Petrol ↓ + Enflasyon ↑',
    patternA: /(petrol|oil|brent|wti).{0,40}(düş|geril|fall|drop|decline)|(düş|geril|fall|drop|decline).{0,40}(petrol|oil|brent|wti)/i,
    patternB: /(enflasyon|inflation|cpi|tüfe).{0,40}(yüksel|artış|rise|surge)|(yüksel|artış|rise|surge).{0,40}(enflasyon|inflation|cpi|tüfe)/i,
    description: 'Enerji-Enflasyon ayrışması. Petrol düşerken enflasyon yüksek kalıyorsa servis fiyatları ve yapısal baskılar baskın — enerji indiriminin rahatlama yaratmadığı anlamına gelir.',
    severity: 'medium',
  },
];

// ─────────────────────────────────────────────────────────────
// ANALYSIS FUNCTIONS
// ─────────────────────────────────────────────────────────────

function containsAny(text: string, words: string[]): boolean {
  const lower = text.toLowerCase();
  return words.some(w => lower.includes(w));
}

function getSentiment(title: string): number {
  const negCount = NEGATIVE_WORDS.filter(w => title.toLowerCase().includes(w)).length;
  const posCount = POSITIVE_WORDS.filter(w => title.toLowerCase().includes(w)).length;
  if (negCount === 0 && posCount === 0) return 0;
  return (posCount - negCount) / (posCount + negCount);
}

function getSmartMoneyScore(title: string): number {
  const matches = SMART_MONEY_WORDS.filter(w => title.toLowerCase().includes(w)).length;
  return Math.min(95, 40 + matches * 18);
}

function getRetailScore(title: string): number {
  const matches = RETAIL_WORDS.filter(w => title.toLowerCase().includes(w)).length;
  const sentiment = getSentiment(title);
  return Math.min(98, 30 + matches * 22 + (sentiment > 0.3 ? 12 : 0));
}

function getNewsCategories(title: string): string[] {
  const lower = title.toLowerCase();
  const matched: string[] = [];
  for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      matched.push(catName);
    }
  }
  return matched.slice(0, 3);
}

function detectCorrelationBreaks(allTitles: string[]): string[] {
  const combined = allTitles.join(' ');
  return CORRELATION_PAIRS
    .filter(pair => pair.patternA.test(combined) && pair.patternB.test(combined))
    .map(pair => pair.id);
}

function getItemCorrelation(title: string, brokenIds: string[]): CorrelationPair | null {
  for (const id of brokenIds) {
    const pair = CORRELATION_PAIRS.find(p => p.id === id);
    if (!pair) continue;
    if (pair.patternA.test(title) || pair.patternB.test(title)) return pair;
  }
  return null;
}

function getMacroKeywords(title: string): MacroKeyword[] {
  return MACRO_KEYWORDS.filter(kw => kw.pattern.test(title));
}

function getCategoryActivityCount(catName: string, titles: string[]): number {
  const keywords = CATEGORY_KEYWORDS[catName] ?? [];
  return titles.filter(t => keywords.some(kw => t.toLowerCase().includes(kw))).length;
}

function getCategoryNewsSentiment(catName: string, titles: string[]): number {
  const keywords = CATEGORY_KEYWORDS[catName] ?? [];
  const matching = titles.filter(t => keywords.some(kw => t.toLowerCase().includes(kw)));
  if (matching.length === 0) return 0;
  return matching.reduce((sum, t) => sum + getSentiment(t), 0) / matching.length;
}

function formatTimestamp(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

function SentimentBars({ title }: { title: string }) {
  const sm = getSmartMoneyScore(title);
  const retail = getRetailScore(title);
  const divergence = retail > 75 && sm < 55;

  return (
    <div className="mt-2.5 space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="w-[90px] shrink-0 text-[9px] uppercase tracking-wider text-[#555555] font-mono">Kurumsal</span>
        <div className="flex-1 h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#60A5FA]"
            style={{ width: `${sm}%` }}
          />
        </div>
        <span className="w-6 text-right text-[9px] font-mono text-[#60A5FA] tabular-nums">{sm}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-[90px] shrink-0 text-[9px] uppercase tracking-wider text-[#555555] font-mono">Bireysel</span>
        <div className="flex-1 h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#FB923C]"
            style={{ width: `${retail}%` }}
          />
        </div>
        <span className="w-6 text-right text-[9px] font-mono text-[#FB923C] tabular-nums">{retail}</span>
      </div>
      {divergence && (
        <div className="flex items-center gap-1.5 pt-0.5">
          <span className="h-1 w-1 rounded-full bg-[#FBBF24] shrink-0" />
          <span className="text-[9px] text-[#FBBF24] uppercase tracking-wider font-mono">Zirve Sinyali — Bireysel aşırı coşkulu, kurumsal nötr</span>
        </div>
      )}
    </div>
  );
}

function MacroBadges({ keywords }: { keywords: MacroKeyword[] }) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  if (keywords.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {keywords.map(kw => (
        <div key={kw.term} className="relative">
          <button
            type="button"
            onMouseEnter={() => setActiveTooltip(kw.term)}
            onMouseLeave={() => setActiveTooltip(null)}
            className="flex items-center gap-1 rounded-sm border border-[#2A2A2A] bg-[#141414] px-1.5 py-0.5 text-[9px] text-[#4ADE80] hover:border-[#4ADE80]/40 transition-colors cursor-help"
          >
            <span className="font-mono">{kw.term}</span>
          </button>
          {activeTooltip === kw.term && (
            <div className="absolute bottom-full left-0 mb-2 z-50 w-64 rounded-sm border border-[#2A2A2A] bg-[#0D0D0D] p-3 shadow-xl">
              <div className="text-[11px] font-semibold text-[#E5E5E5] mb-1">{kw.term}</div>
              <div className="text-[10px] text-[#A3A3A3] leading-relaxed">{kw.description}</div>
              <div className="mt-2 text-[9px] text-[#4ADE80] font-mono">→ {kw.relatedCategory}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TierBadge({ tier }: { tier: 'critical' | 'daily' | 'other' }) {
  if (tier === 'critical') {
    return (
      <span className="shrink-0 rounded-sm border border-[#3F1818] bg-[#140B0B] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[#F87171] font-mono">
        Kritik
      </span>
    );
  }
  if (tier === 'daily') {
    return (
      <span className="shrink-0 rounded-sm border border-[#1D2C44] bg-[#0D1420] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[#60A5FA] font-mono">
        Günlük
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-sm border border-[#1F1F1F] bg-[#111111] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[#666666] font-mono">
      Diğer
    </span>
  );
}

function NewsCard({
  item,
  brokenCorrelationIds,
  selectedCategory,
}: {
  item: NewsItem;
  brokenCorrelationIds: string[];
  selectedCategory: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const sentiment = getSentiment(item.title);
  const categories = useMemo(() => getNewsCategories(item.title), [item.title]);
  const correlationBreak = useMemo(() => getItemCorrelation(item.title, brokenCorrelationIds), [item.title, brokenCorrelationIds]);
  const macroKeywords = useMemo(() => getMacroKeywords(item.title), [item.title]);
  const ts = formatTimestamp(item.publishedAt);

  const sentimentDot = sentiment > 0.2 ? 'bg-[#4ADE80]' : sentiment < -0.2 ? 'bg-[#F87171]' : 'bg-[#555555]';

  return (
    <div className={`rounded-sm border bg-[#0D0D0D] transition-colors ${
      item.tier === 'critical' ? 'border-[#2A1010]' : 'border-[#1A1A1A]'
    }`}>
      <div className="p-3">
        {/* Top row: tier badge + timestamp + external link */}
        <div className="flex items-center gap-2 mb-2">
          <TierBadge tier={item.tier} />
          {correlationBreak && (
            <span className={`rounded-sm border px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-mono ${
              correlationBreak.severity === 'high'
                ? 'border-[#3C2510] bg-[#130E08] text-[#FB923C]'
                : 'border-[#3C3113] bg-[#120F0A] text-[#FBBF24]'
            }`}>
              Kor. Kırılım
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {ts && <span className="text-[9px] font-mono text-[#3A3A3A] tabular-nums">{ts}</span>}
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="text-[#333333] hover:text-[#666666] transition-colors"
              title="Habere git"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Title */}
        <a
          href={item.link}
          target="_blank"
          rel="noreferrer"
          className="group"
        >
          <div className="flex items-start gap-2">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${sentimentDot}`} />
            <span className="text-sm text-[#D4D4D4] leading-relaxed group-hover:text-[#F5F5F5] transition-colors">
              {item.title}
            </span>
          </div>
        </a>

        {/* Category tags */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 ml-3.5">
            {categories.map(cat => (
              <span
                key={cat}
                className={`text-[9px] px-1.5 py-0.5 rounded-sm border font-mono ${
                  selectedCategory === cat
                    ? 'border-[#4ADE80]/50 bg-[#0D1A0D] text-[#4ADE80]'
                    : 'border-[#1F1F1F] bg-[#141414] text-[#555555]'
                }`}
              >
                {cat.split(' ').slice(0, 2).join(' ')}
              </span>
            ))}
          </div>
        )}

        {/* Macro keywords */}
        {macroKeywords.length > 0 && (
          <div className="ml-3.5">
            <MacroBadges keywords={macroKeywords} />
          </div>
        )}

        {/* Expand for SM vs Retail */}
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="ml-3.5 mt-2 flex items-center gap-1 text-[9px] text-[#3A3A3A] hover:text-[#666666] transition-colors font-mono uppercase tracking-wider"
        >
          <Activity className="w-2.5 h-2.5" />
          {expanded ? 'Gizle' : 'Sentiment Analizi'}
        </button>

        {expanded && (
          <div className="ml-3.5 mt-1 border-t border-[#1A1A1A] pt-2">
            <SentimentBars title={item.title} />
          </div>
        )}

        {/* Correlation break detail */}
        {correlationBreak && expanded && (
          <div className="ml-3.5 mt-2 rounded-sm border border-[#2A1F10] bg-[#110D08] p-2">
            <div className="flex items-start gap-1.5">
              <Zap className="w-3 h-3 text-[#FB923C] mt-0.5 shrink-0" />
              <div>
                <div className="text-[9px] font-mono text-[#FB923C] uppercase tracking-wider mb-0.5">{correlationBreak.label}</div>
                <div className="text-[10px] text-[#7A6A5A] leading-relaxed">{correlationBreak.description}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// NARRATIVE HEATMAP
// ─────────────────────────────────────────────────────────────

const SHORT_NAMES: Record<string, string> = {
  'Kredi ve Finansal Stres': 'Kredi / Stres',
  'Piyasa Likiditesi': 'Likidite',
  'Reel Ekonomi ve Büyüme': 'Büyüme',
  'Enflasyon Baskıları': 'Enflasyon',
  'Küresel Riskler': 'Küresel Risk',
  'Siyasi ve Sosyal İstikrar': 'Sosyal / Siyasi',
  'Teknoloji ve Yapısal Dönüşüm': 'Teknoloji',
  'Fed İçi Güç Dengesi': 'Fed / Para Pol.',
  'ETF ve Sermaye Akışı': 'ETF / Akışlar',
  'Değerli Metaller': 'Değerli Metaller',
  'Tarımsal Emtia ve Gıda Güvenliği': 'Tarım / Gıda',
  'Enerji ve Enerji Güvenliği': 'Enerji',
  'Döviz ve Kur Dinamikleri': 'Döviz / Kur',
  'Kamu Maliyesi ve Sovereign Borç': 'Kamu Maliyesi',
  'Gelişmekte Olan Piyasalar': 'Gelişmekte',
  'Kripto Para Piyasaları': 'Kripto',
  'Polymarket / Kalshi Tahmin Piyasaları': 'Tahmin Piy.',
  'Volatilite ve Türev Piyasaları': 'Volatilite',
  'Konut ve Gayrimenkul': 'Konut / GYO',
  'Piyasa Genişliği ve Pozisyonlanma': 'Breadth',
  'İşgücü ve Ücret Dinamikleri': 'İşgücü',
  'Küresel Ticaret ve Tedarik Zinciri': 'Ticaret / Tarife',
};

type TileColors = { bg: string; border: string; text: string; muted: string; bar: string };

function getTileColors(activity: number, sentiment: number, score: number | null, isSelected: boolean): TileColors {
  if (activity > 0) {
    if (sentiment < -0.15) {
      return {
        bg: isSelected ? '#1E0B0B' : '#140808',
        border: isSelected ? '#EF4444' : '#3F1818',
        text: '#F87171',
        muted: '#7F3A3A',
        bar: '#EF4444',
      };
    }
    if (sentiment > 0.15) {
      return {
        bg: isSelected ? '#0B1E0B' : '#081408',
        border: isSelected ? '#22C55E' : '#16351F',
        text: '#4ADE80',
        muted: '#2E6A40',
        bar: '#22C55E',
      };
    }
    return {
      bg: isSelected ? '#1A180A' : '#121008',
      border: isSelected ? '#EAB308' : '#3C3113',
      text: '#FBBF24',
      muted: '#7A6020',
      bar: '#EAB308',
    };
  }

  const s = score ?? 50;
  if (s < 35) {
    return {
      bg: isSelected ? '#160B0B' : '#0E0707',
      border: isSelected ? '#7F3030' : '#2A1010',
      text: '#7F3030',
      muted: '#3A1A1A',
      bar: '#7F3030',
    };
  }
  if (s < 55) {
    return {
      bg: isSelected ? '#161208' : '#0E0C06',
      border: isSelected ? '#7A6020' : '#2A2210',
      text: '#6B6020',
      muted: '#3A3010',
      bar: '#7A6020',
    };
  }
  return {
    bg: isSelected ? '#0B160B' : '#070E07',
    border: isSelected ? '#2A5A2A' : '#1A2A1A',
    text: '#2E5A2E',
    muted: '#1A3A1A',
    bar: '#2A5A2A',
  };
}

function NarrativeHeatmap({
  categories,
  allTitles,
  selected,
  onSelect,
}: {
  categories: DashboardData['categories'];
  allTitles: string[];
  selected: string | null;
  onSelect: (name: string | null) => void;
}) {
  return (
    <div className="rounded-sm border border-[#1F1F1F] bg-[#0A0A0A] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#1A1A1A] shrink-0">
        <Activity className="w-3 h-3 text-[#444444] shrink-0" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#444444]">
          Narrative Harita
        </span>
        {selected && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="ml-auto text-[9px] text-[#555555] hover:text-[#A3A3A3] font-mono transition-colors"
          >
            ✕ kaldır
          </button>
        )}
      </div>

      {/* Tiles — single column, scrollable */}
      <div className="flex-1 overflow-y-auto py-1">
        {categories.map(cat => {
          const activity = getCategoryActivityCount(cat.name, allTitles);
          const sentiment = getCategoryNewsSentiment(cat.name, allTitles);
          const isSelected = selected === cat.name;
          const colors = getTileColors(activity, sentiment, cat.score, isSelected);
          const shortName = SHORT_NAMES[cat.name] ?? cat.name.split(' ').slice(0, 3).join(' ');
          const scoreVal = cat.score !== null ? Math.round(cat.score) : null;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(isSelected ? null : cat.name)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all hover:bg-[#111111]"
              style={{
                borderLeft: isSelected ? `2px solid ${colors.bar}` : '2px solid transparent',
              }}
            >
              {/* Sentiment dot */}
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: activity > 0 ? colors.bar : '#2A2A2A' }}
              />

              {/* Category name */}
              <span
                className="flex-1 min-w-0 text-[11px] font-medium leading-snug text-left"
                style={{ color: activity > 0 ? colors.text : '#4A4A4A' }}
              >
                {shortName}
              </span>

              {/* Right: score + activity count */}
              <div className="shrink-0 flex items-center gap-1.5 ml-1">
                {activity > 0 && (
                  <span className="text-[9px] font-mono" style={{ color: colors.muted }}>
                    {activity}h
                  </span>
                )}
                <span
                  className="text-[13px] font-bold font-mono tabular-nums w-7 text-right"
                  style={{ color: scoreVal !== null ? (activity > 0 ? colors.text : '#3A3A3A') : '#2A2A2A' }}
                >
                  {scoreVal ?? '—'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="shrink-0 border-t border-[#1A1A1A] px-3 py-2.5 space-y-1">
        {[
          { color: '#EF4444', label: 'Negatif haber' },
          { color: '#EAB308', label: 'Karma sinyal' },
          { color: '#22C55E', label: 'Pozitif haber' },
          { color: '#2A2A2A', label: 'Haber yok' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-[9px] font-mono text-[#333333]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CORRELATION ALERTS BANNER
// ─────────────────────────────────────────────────────────────

function CorrelationAlertsBanner({ brokenIds }: { brokenIds: string[] }) {
  const broken = CORRELATION_PAIRS.filter(p => brokenIds.includes(p.id));
  if (broken.length === 0) return null;

  return (
    <div className="rounded-sm border border-[#2A1A0A] bg-[#0D0908] p-3">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-3.5 h-3.5 text-[#FB923C]" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FB923C]">
          Korelasyon Kırılım Uyarısı — {broken.length} çift
        </span>
      </div>
      <div className="space-y-1.5">
        {broken.map(pair => (
          <div key={pair.id} className="flex items-start gap-2">
            <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${pair.severity === 'high' ? 'bg-[#F87171]' : 'bg-[#FBBF24]'}`} />
            <div>
              <span className="text-[10px] text-[#FB923C] font-mono mr-2">{pair.label}</span>
              <span className="text-[10px] text-[#665040] leading-relaxed">{pair.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

interface NewsPageProps {
  news: DashboardData['news'];
  categories: DashboardData['categories'];
}

type FilterTab = 'all' | 'critical' | 'daily' | 'other';

export function NewsPage({ news, categories }: NewsPageProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const allItems = useMemo<NewsItem[]>(() => [
    ...news.critical.map(item => ({ ...item, tier: 'critical' as const })),
    ...news.daily.map(item => ({ ...item, tier: 'daily' as const })),
    ...news.other.map(item => ({ ...item, tier: 'other' as const })),
  ], [news]);

  const allTitles = useMemo(() => allItems.map(item => item.title), [allItems]);

  const brokenCorrelationIds = useMemo(() => detectCorrelationBreaks(allTitles), [allTitles]);

  const filteredItems = useMemo(() => {
    let items = allItems;
    if (activeFilter !== 'all') {
      items = items.filter(item => item.tier === activeFilter);
    }
    if (selectedCategory) {
      items = items.filter(item => containsAny(item.title, CATEGORY_KEYWORDS[selectedCategory] ?? []));
    }
    return items;
  }, [allItems, activeFilter, selectedCategory]);

  const counts = {
    all: allItems.length,
    critical: news.critical.length,
    daily: news.daily.length,
    other: news.other.length,
  };

  const TABS: { key: FilterTab; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'Tümü', icon: <Activity className="w-3 h-3" /> },
    { key: 'critical', label: 'Kritik', icon: <AlertTriangle className="w-3 h-3" /> },
    { key: 'daily', label: 'Günlük', icon: <TrendingUp className="w-3 h-3" /> },
    { key: 'other', label: 'Diğer', icon: <TrendingDown className="w-3 h-3" /> },
  ];

  return (
    <div className="flex gap-4">
      {/* LEFT: Narrative Heatmap — side panel */}
      <div className="w-[230px] shrink-0 self-start sticky top-0" style={{ maxHeight: 'calc(100vh - 120px)' }}>
        <NarrativeHeatmap
          categories={categories}
          allTitles={allTitles}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      {/* RIGHT: News feed */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Correlation Alerts */}
        {brokenCorrelationIds.length > 0 && (
          <CorrelationAlertsBanner brokenIds={brokenCorrelationIds} />
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 border-b border-[#1A1A1A] pb-3">
          {TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={`flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors ${
                activeFilter === tab.key
                  ? 'border-[#333333] bg-[#1A1A1A] text-[#E5E5E5]'
                  : 'border-[#1A1A1A] bg-transparent text-[#555555] hover:text-[#A3A3A3] hover:border-[#2A2A2A]'
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`ml-0.5 tabular-nums ${activeFilter === tab.key ? 'text-[#666666]' : 'text-[#3A3A3A]'}`}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
          {brokenCorrelationIds.length > 0 && (
            <div className="ml-auto flex items-center gap-1.5 text-[9px] text-[#FB923C] font-mono">
              <Zap className="w-2.5 h-2.5" />
              {brokenCorrelationIds.length} korelasyon kırıldı
            </div>
          )}
        </div>

        {/* News items */}
        {filteredItems.length > 0 ? (
          <div className="space-y-2">
            {(filteredItems as NewsItem[]).map(item => (
              <React.Fragment key={item.id}>
                <NewsCard
                  item={item}
                  brokenCorrelationIds={brokenCorrelationIds}
                  selectedCategory={selectedCategory}
                />
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Activity className="w-8 h-8 text-[#222222] mb-3" />
            <div className="text-sm text-[#444444] font-mono">
              {selectedCategory
                ? `"${selectedCategory}" kategorisine ait haber bulunamadı.`
                : 'Gösterilecek haber yok.'}
            </div>
            {selectedCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="mt-2 text-[11px] text-[#555555] hover:text-[#A3A3A3] underline font-mono transition-colors"
              >
                Filtreyi kaldır
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

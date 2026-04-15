import React, { useEffect, useRef, useState } from 'react';
import { Home, Activity, AlertTriangle, Settings, BarChart2, Globe, TrendingDown, Users, Cpu, Landmark, DollarSign, Hexagon, Wheat, Zap, ArrowLeftRight, Building2, TrendingUp, Bitcoin, Search } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  score?: number | null;
}

interface LayoutProps {
  children: React.ReactNode;
  lastUpdate?: string | null;
  categories?: Category[];
  alertCount?: number;
  selectedCategoryId?: string;
  onSelectCategory?: (id: string) => void;
  onOpenSearch?: () => void;
}

const ALERTS_SECTION_ID = 'alerts';
const DIVERGENCES_SECTION_ID = 'divergences';
const SETTINGS_SECTION_ID = 'settings';
const COOLDOWN_SECTION_ID = 'cooldown';

const getCategoryIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('kredi') || lowerName.includes('stres')) return <Activity />;
  if (lowerName.includes('likidite') || lowerName.includes('para')) return <DollarSign />;
  if (lowerName.includes('reel') || lowerName.includes('büyüme')) return <TrendingDown />;
  if (lowerName.includes('enflasyon')) return <BarChart2 />;
  if (lowerName.includes('küresel') || lowerName.includes('jeopolitik')) return <Globe />;
  if (lowerName.includes('sosyal')) return <Users />;
  if (lowerName.includes('teknoloji')) return <Cpu />;
  if (lowerName.includes('fed')) return <Landmark />;
  if (lowerName.includes('tarım')) return <Wheat />;
  if (lowerName.includes('enerji')) return <Zap />;
  if (lowerName.includes('döviz') || lowerName.includes('kur')) return <ArrowLeftRight />;
  if (lowerName.includes('kamu') || lowerName.includes('maliye') || lowerName.includes('sovereign') || lowerName.includes('borç')) return <Building2 />;
  if (lowerName.includes('gelişmekte')) return <TrendingUp />;
  if (lowerName.includes('kripto')) return <Bitcoin />;
  if (lowerName.includes('polymarket') || lowerName.includes('kalshi') || lowerName.includes('beklenti') || lowerName.includes('tahmin')) return <BarChart2 />;
  if (lowerName.includes('volatilite') || lowerName.includes('türev')) return <Activity />;
  if (lowerName.includes('konut') || lowerName.includes('gayrimenkul')) return <Building2 />;
  if (lowerName.includes('genişliği') || lowerName.includes('pozisyon')) return <TrendingUp />;
  if (lowerName.includes('işgücü') || lowerName.includes('ücret')) return <Users />;
  if (lowerName.includes('ticaret') || lowerName.includes('tedarik')) return <Globe />;
  return <Hexagon />;
};

const PLACEHOLDERS: Record<string, string> = {
  '30000000-0000-0000-0000-000000000001': 'Siyasi ve Sosyal İstikrar',
  '30000000-0000-0000-0000-000000000002': 'Teknoloji ve Yapısal Dönüşüm',
  '30000000-0000-0000-0000-000000000003': 'Fed İçi Güç Dengesi',
  '30000000-0000-0000-0000-000000000004': 'ETF ve Sermaye Akışı',
  '30000000-0000-0000-0000-000000000005': 'Değerli Metaller',
  '30000000-0000-0000-0000-000000000006': 'Tarımsal Emtia ve Gıda Güvenliği',
  '30000000-0000-0000-0000-000000000007': 'Enerji ve Enerji Güvenliği',
  '30000000-0000-0000-0000-000000000008': 'Döviz ve Kur Dinamikleri',
  '30000000-0000-0000-0000-000000000009': 'Kamu Maliyesi ve Sovereign Borç',
  '30000000-0000-0000-0000-000000000010': 'Gelişmekte Olan Piyasalar',
  '30000000-0000-0000-0000-000000000011': 'Kripto Para Piyasaları',
  '30000000-0000-0000-0000-000000000012': 'Polymarket / Kalshi Tahmin Piyasaları',
  '30000000-0000-0000-0000-000000000013': 'Volatilite ve Türev Piyasaları',
  '30000000-0000-0000-0000-000000000014': 'Konut ve Gayrimenkul',
  '30000000-0000-0000-0000-000000000015': 'Piyasa Genişliği ve Pozisyonlanma',
  '30000000-0000-0000-0000-000000000016': 'İşgücü ve Ücret Dinamikleri',
  '30000000-0000-0000-0000-000000000017': 'Küresel Ticaret ve Tedarik Zinciri',
};

type MarketStatus = {
  label: string;
  isOpen: boolean;
};

const LANGUAGES = [
  { label: 'Türkçe', flag: '🇹🇷' },
  { label: 'English', flag: '🇺🇸' },
  { label: '中文', flag: '🇨🇳' },
  { label: '日本語', flag: '🇯🇵' },
] as const;

function getTimeParts(timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? 'Mon';
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');

  return { weekday, minutes: hour * 60 + minute };
}

function isWeekday(weekday: string) {
  return !['Sat', 'Sun'].includes(weekday);
}

function isWithin(minutes: number, start: number, end: number) {
  return minutes >= start && minutes < end;
}

function getMarketStatuses(): MarketStatus[] {
  const newYork = getTimeParts('America/New_York');
  const berlin = getTimeParts('Europe/Berlin');
  const shanghai = getTimeParts('Asia/Shanghai');

  return [
    {
      label: 'Pre-Market',
      isOpen: isWeekday(newYork.weekday) && isWithin(newYork.minutes, 4 * 60, 9 * 60 + 30),
    },
    {
      label: 'Bitcoin',
      isOpen: true,
    },
    {
      label: 'Amerika',
      isOpen: isWeekday(newYork.weekday) && isWithin(newYork.minutes, 9 * 60 + 30, 16 * 60),
    },
    {
      label: 'Avrupa',
      isOpen: isWeekday(berlin.weekday) && isWithin(berlin.minutes, 9 * 60, 17 * 60 + 30),
    },
    {
      label: 'Çin',
      isOpen: isWeekday(shanghai.weekday) && isWithin(shanghai.minutes, 9 * 60 + 30, 15 * 60),
    },
  ];
}

const CRYPTO_CATEGORY_ID = '30000000-0000-0000-0000-000000000011';
const PREDICTION_CATEGORY_ID = '30000000-0000-0000-0000-000000000012';

export function Layout({ children, lastUpdate, categories = [], alertCount = 0, selectedCategoryId, onSelectCategory, onOpenSearch }: LayoutProps) {
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement | null>(null);
  const visiblePlaceholders = Object.entries(PLACEHOLDERS).filter(
    ([id]) => !categories.some((category) => category.id === id),
  );
  const marketStatuses = getMarketStatuses();

  const cryptoFromDb = categories.find(c => c.id === CRYPTO_CATEGORY_ID);
  const predictionFromDb = categories.find(c => c.id === PREDICTION_CATEGORY_ID);
  const otherCategories = categories.filter(c => c.id !== CRYPTO_CATEGORY_ID && c.id !== PREDICTION_CATEGORY_ID);
  const cryptoPlaceholder = visiblePlaceholders.find(([id]) => id === CRYPTO_CATEGORY_ID);
  const predictionPlaceholder = visiblePlaceholders.find(([id]) => id === PREDICTION_CATEGORY_ID);
  const otherPlaceholders = visiblePlaceholders.filter(([id]) => id !== CRYPTO_CATEGORY_ID && id !== PREDICTION_CATEGORY_ID);

  useEffect(() => {
    if (!isLanguageMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!languageMenuRef.current?.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [isLanguageMenuOpen]);

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-[#E5E5E5] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[280px] shrink-0 border-r border-[#1F1F1F] bg-[#0A0A0A] flex flex-col">
        <button
          type="button"
          onClick={() => onSelectCategory && onSelectCategory('home')}
          className="px-4 h-[44px] border-b border-[#1F1F1F] flex items-center gap-2 text-left hover:bg-[#111111] transition-colors shrink-0"
        >
          <Hexagon className="w-4 h-4 text-[#A3A3A3]" />
          <span className="font-semibold tracking-wide text-[12px] uppercase">Mergen Intelligence</span>
        </button>
        
        <div className="flex-1 overflow-y-auto py-3">
          <div className="px-4 mb-1.5 flex items-center justify-between gap-3 text-[10px] font-semibold text-[#666666] uppercase tracking-[0.16em]">
            <span>Kategoriler</span>
            <span>[SKOR]</span>
          </div>
          <nav className="space-y-0.5">
            <NavItem 
              icon={<Home />} 
              label="Home" 
              active={selectedCategoryId === 'home'} 
              onClick={() => onSelectCategory && onSelectCategory('home')}
            />
            <NavItem
              icon={<Globe />}
              label="Haberler"
              active={selectedCategoryId === 'news'}
              onClick={() => onSelectCategory && onSelectCategory('news')}
            />
            {/* Kripto her zaman Haberler'in hemen altında */}
            {cryptoFromDb ? (
              <NavItem
                key={cryptoFromDb.id}
                icon={getCategoryIcon(cryptoFromDb.name)}
                label={cryptoFromDb.name}
                active={cryptoFromDb.id === selectedCategoryId}
                onClick={() => onSelectCategory && onSelectCategory(cryptoFromDb.id)}
                badge={cryptoFromDb.score !== null && cryptoFromDb.score !== undefined ? String(cryptoFromDb.score) : undefined}
              />
            ) : cryptoPlaceholder ? (
              <NavItem
                key={cryptoPlaceholder[0]}
                icon={getCategoryIcon(cryptoPlaceholder[1])}
                label={cryptoPlaceholder[1]}
                active={selectedCategoryId === cryptoPlaceholder[0]}
                onClick={() => onSelectCategory && onSelectCategory(cryptoPlaceholder[0])}
              />
            ) : null}
            {predictionFromDb ? (
              <NavItem
                key={predictionFromDb.id}
                icon={getCategoryIcon(predictionFromDb.name)}
                label={predictionFromDb.name}
                active={predictionFromDb.id === selectedCategoryId}
                onClick={() => onSelectCategory && onSelectCategory(predictionFromDb.id)}
                badge={predictionFromDb.score !== null && predictionFromDb.score !== undefined ? String(predictionFromDb.score) : undefined}
              />
            ) : predictionPlaceholder ? (
              <NavItem
                key={predictionPlaceholder[0]}
                icon={getCategoryIcon(predictionPlaceholder[1])}
                label={predictionPlaceholder[1]}
                active={selectedCategoryId === predictionPlaceholder[0]}
                onClick={() => onSelectCategory && onSelectCategory(predictionPlaceholder[0])}
              />
            ) : null}
            {otherCategories.map((cat) => (
              <NavItem
                key={cat.id}
                icon={getCategoryIcon(cat.name)}
                label={cat.name}
                active={cat.id === selectedCategoryId}
                onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                badge={cat.score !== null && cat.score !== undefined ? String(cat.score) : undefined}
              />
            ))}
            {otherPlaceholders.map(([id, label]) => (
            <NavItem
              key={id}
              icon={getCategoryIcon(label)}
                label={label}
                active={selectedCategoryId === id}
                onClick={() => onSelectCategory && onSelectCategory(id)}
              />
            ))}
          </nav>

          <div className="px-4 mt-6 mb-1.5 text-[10px] font-semibold text-[#666666] uppercase tracking-[0.16em]">
            Sistem
          </div>
          <nav className="space-y-0.5">
            <NavItem
              icon={<AlertTriangle />}
              label="Uyarılar"
              badge={String(alertCount)}
              active={selectedCategoryId === ALERTS_SECTION_ID}
              onClick={() => onSelectCategory && onSelectCategory(ALERTS_SECTION_ID)}
            />
            <NavItem
              icon={<Activity />}
              label="Sapmalar"
              badge="0"
              active={selectedCategoryId === DIVERGENCES_SECTION_ID}
              onClick={() => onSelectCategory && onSelectCategory(DIVERGENCES_SECTION_ID)}
            />
            <NavItem
              icon={<Settings />}
              label="Ayarlar"
              active={selectedCategoryId === SETTINGS_SECTION_ID}
              onClick={() => onSelectCategory && onSelectCategory(SETTINGS_SECTION_ID)}
            />
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="border-b border-[#1F1F1F] px-5 h-[44px] shrink-0 bg-[#0A0A0A] flex items-center">
          <div className="flex items-center gap-3 w-full">

            {/* Market status badges */}
            <div className="flex items-center gap-1.5 shrink-0">
              {marketStatuses.map((market) => (
                <div
                  key={market.label}
                  className={`flex items-center gap-1.5 rounded-sm border px-2 py-1 ${
                    market.isOpen ? 'border-[#1A1A1A] bg-[#0D0D0D]' : 'border-[#2A1010] bg-[#130808]'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full shrink-0 ${market.isOpen ? 'bg-[#4ADE80]' : 'bg-[#7A2222]'}`}
                  />
                  <span className={`text-[10px] uppercase tracking-wider ${market.isOpen ? 'text-[#6A6A6A]' : 'text-[#7A4040]'}`}>
                    {market.label}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-semibold ${
                      market.isOpen ? 'text-[#4ADE80]' : 'text-[#8B3030]'
                    }`}
                  >
                    {market.isOpen ? 'Açık' : 'Kapalı'}
                  </span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-[#1F1F1F] shrink-0" />

            {/* Search */}
            <div className="flex-1 min-w-0">
              {onOpenSearch ? (
                <button
                  type="button"
                  onClick={onOpenSearch}
                  className="w-full max-w-xs flex items-center justify-between gap-2 rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] px-2.5 py-1.5 text-[11px] text-[#5A5A5A] hover:text-[#888888] hover:border-[#2A2A2A] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-3 h-3" />
                    <span>Ara...</span>
                  </span>
                  <span className="rounded-sm border border-[#1F1F1F] bg-[#111111] px-1.5 py-0.5 text-[9px] font-mono text-[#4A4A4A]">⌘K</span>
                </button>
              ) : (
                <div className="w-full max-w-xs flex items-center gap-2 rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] px-2.5 py-1.5">
                  <Search className="w-3 h-3 text-[#4A4A4A] shrink-0" />
                  <input
                    type="text"
                    placeholder="Ara..."
                    className="flex-1 bg-transparent text-[11px] text-[#A3A3A3] placeholder-[#444444] outline-none"
                  />
                </div>
              )}
            </div>

            {/* Right: Language + Last update */}
            <div className="flex items-center gap-3 ml-auto shrink-0">
              {/* Divider */}
              <div className="h-4 w-px bg-[#1F1F1F]" />

              {/* Language dropdown */}
              <div ref={languageMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsLanguageMenuOpen((open) => !open)}
                  className="flex items-center gap-1.5 rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] px-2 py-1.5 text-[11px] text-[#6A6A6A] hover:text-[#A3A3A3] hover:border-[#2A2A2A] transition-colors"
                >
                  <span className="text-sm leading-none">🇹🇷</span>
                  <span className="text-[10px] uppercase tracking-wider font-mono">TR</span>
                  <svg
                    className={`h-2.5 w-2.5 text-[#4A4A4A] transition-transform ${isLanguageMenuOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {isLanguageMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[140px] rounded-sm border border-[#1F1F1F] bg-[#111111] p-1 shadow-[0_12px_28px_rgba(0,0,0,0.4)] origin-top-right animate-[languagePopover_180ms_ease-out]">
                    {LANGUAGES.map((language, index) => (
                      <button
                        key={language.label}
                        type="button"
                        onClick={() => setIsLanguageMenuOpen(false)}
                        className={`flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-[11px] transition-colors ${
                          index === 0
                            ? 'bg-[#0A0A0A] text-[#E5E5E5]'
                            : 'text-[#666666] hover:bg-[#141414] hover:text-[#D4D4D4]'
                        }`}
                      >
                        <span className="text-xs leading-none">{language.flag}</span>
                        <span>{language.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Last update */}
              <div className="flex items-center gap-1.5 text-[10px] font-mono tabular-nums">
                <span className="text-[#3A3A3A] uppercase tracking-wider">Güncelleme:</span>
                <span className="text-[#555555]">
                  {lastUpdate
                    ? new Date(lastUpdate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
                    : '--:--'}
                </span>
              </div>
            </div>

          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, badge, onClick }: { key?: React.Key; icon: React.ReactNode; label: string; active?: boolean; badge?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start justify-between gap-3 px-4 py-1.5 text-[13px] group relative cursor-pointer transition-colors ${
        active ? 'text-[#E5E5E5] bg-[#111111]' : 'text-[#A3A3A3] hover:text-[#E5E5E5] hover:bg-[#111111]'
      }`}
    >
      {active && (
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#E5E5E5]" />
      )}
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <div className="mt-0.5 h-3.5 w-3.5 shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:stroke-[1.5]">
          {icon}
        </div>
        <span className="min-w-0 text-left leading-[1.25rem] whitespace-normal break-words">
          {label}
        </span>
      </div>
      {badge && (
        <span className="mt-0.5 shrink-0 text-[9px] tabular-nums bg-[#1F1F1F] text-[#A3A3A3] px-1.5 py-0.5 rounded-sm">
          {badge}
        </span>
      )}
    </button>
  );
}

import React from 'react';
import { Home, Activity, AlertTriangle, Settings, BarChart2, Globe, TrendingDown, Users, Cpu, Landmark, DollarSign, Hexagon, Wheat, Zap, ArrowLeftRight, Building2, TrendingUp, Bitcoin } from 'lucide-react';

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
}

const ALERTS_SECTION_ID = 'alerts';
const DIVERGENCES_SECTION_ID = 'divergences';
const SETTINGS_SECTION_ID = 'settings';

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
};

type MarketStatus = {
  label: string;
  isOpen: boolean;
};

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
      label: 'Erken Piyasalar',
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

export function Layout({ children, lastUpdate, categories = [], alertCount = 0, selectedCategoryId, onSelectCategory }: LayoutProps) {
  const visiblePlaceholders = Object.entries(PLACEHOLDERS).filter(
    ([id]) => !categories.some((category) => category.id === id),
  );
  const marketStatuses = getMarketStatuses();

  const cryptoFromDb = categories.find(c => c.id === CRYPTO_CATEGORY_ID);
  const otherCategories = categories.filter(c => c.id !== CRYPTO_CATEGORY_ID);
  const cryptoPlaceholder = visiblePlaceholders.find(([id]) => id === CRYPTO_CATEGORY_ID);
  const otherPlaceholders = visiblePlaceholders.filter(([id]) => id !== CRYPTO_CATEGORY_ID);

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-[#E5E5E5] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[280px] shrink-0 border-r border-[#1F1F1F] bg-[#0A0A0A] flex flex-col">
        <button
          type="button"
          onClick={() => onSelectCategory && onSelectCategory('home')}
          className="p-4 border-b border-[#1F1F1F] flex items-center gap-2 text-left hover:bg-[#111111] transition-colors"
        >
          <Hexagon className="w-4 h-4 text-[#A3A3A3]" />
          <span className="font-semibold tracking-wide text-sm uppercase">Mergen Intelligence</span>
        </button>
        
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-[#666666] uppercase tracking-wider">
            <span>Kategoriler</span>
            <span>[SKOR]</span>
          </div>
          <nav className="space-y-1">
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

          <div className="px-4 mt-8 mb-2 text-[11px] font-semibold text-[#666666] uppercase tracking-wider">
            Sistem
          </div>
          <nav className="space-y-1">
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
        <header className="border-b border-[#1F1F1F] px-6 py-3 shrink-0 bg-[#0A0A0A]">
          <div className="flex items-center justify-between gap-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="text-xs text-[#A3A3A3] shrink-0">
                <span className="text-[#E5E5E5] font-medium">
                  {selectedCategoryId === 'home'
                    ? 'Mergen Intelligence Dashboard' 
                    : selectedCategoryId === 'news'
                      ? 'Haberler'
                      : selectedCategoryId === ALERTS_SECTION_ID
                        ? 'Uyarılar'
                        : selectedCategoryId === SETTINGS_SECTION_ID
                          ? 'Ayarlar'
                      : categories.find(c => c.id === selectedCategoryId)?.name || PLACEHOLDERS[selectedCategoryId || ''] || 'Kategori'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {marketStatuses.map((market) => (
                  <div
                    key={market.label}
                    className="flex items-center gap-2 rounded-sm border border-[#1F1F1F] bg-[#111111] px-2.5 py-1"
                  >
                    <span className="text-[10px] uppercase tracking-wider text-[#A3A3A3]">
                      {market.label}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider ${
                        market.isOpen ? 'text-[#4ADE80]' : 'text-[#F87171]'
                      }`}
                    >
                      {market.isOpen ? 'Açık' : 'Kapalı'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-[11px] text-[#666666] tabular-nums shrink-0">
              Son güncelleme: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }) : '--:--'}
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
      className={`w-full flex items-start justify-between gap-3 px-4 py-2 text-sm group relative cursor-pointer transition-colors ${
        active ? 'text-[#E5E5E5] bg-[#111111]' : 'text-[#A3A3A3] hover:text-[#E5E5E5] hover:bg-[#111111]'
      }`}
    >
      {active && (
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#E5E5E5]" />
      )}
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="mt-0.5 h-4 w-4 shrink-0 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:stroke-[1.5]">
          {icon}
        </div>
        <span className="min-w-0 text-left leading-5 whitespace-normal break-words">
          {label}
        </span>
      </div>
      {badge && (
        <span className="mt-0.5 shrink-0 text-[10px] tabular-nums bg-[#1F1F1F] text-[#A3A3A3] px-1.5 py-0.5 rounded-sm">
          {badge}
        </span>
      )}
    </button>
  );
}

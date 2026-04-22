import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Crown,
  Landmark,
  Radio,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

type PortfolioSource = '13F' | 'Form 4' | 'Congress' | 'Media' | 'Public' | 'Unclear';
type PrimaryFilter = 'All' | 'Funds' | 'Tech' | 'Politics' | 'Media';

type RadarPerson = {
  name: string;
  source: PortfolioSource;
  role: string;
  focus: string;
  cadence: string;
  confidence: 'Yüksek' | 'Orta' | 'Düşük';
  note: string;
  tags: string[];
};

type HoldingPreview = {
  symbol: string;
  name: string;
  weight: number;
  stance: 'core' | 'added' | 'trimmed' | 'watch';
};

type RecentMove = {
  label: string;
  tone: 'buy' | 'sell' | 'watch';
};

type ActionSignal = {
  text: string;
  tone: 'buy' | 'sell' | 'watch';
  date: string;
  source: PortfolioSource;
};

const SOURCE_META: Record<PortfolioSource, { label: string; accent: string; bg: string; icon: React.ReactNode }> = {
  '13F': {
    label: '13F',
    accent: '#F1B84A',
    bg: 'rgba(241, 184, 74, 0.10)',
    icon: <Building2 className="h-3.5 w-3.5" />,
  },
  'Form 4': {
    label: 'Form 4 / Insider',
    accent: '#72D39A',
    bg: 'rgba(114, 211, 154, 0.10)',
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
  },
  Congress: {
    label: 'Kongre / Kamu',
    accent: '#7FB4FF',
    bg: 'rgba(127, 180, 255, 0.10)',
    icon: <Landmark className="h-3.5 w-3.5" />,
  },
  Media: {
    label: 'Medya Portföyü',
    accent: '#C7A36A',
    bg: 'rgba(199, 163, 106, 0.10)',
    icon: <Radio className="h-3.5 w-3.5" />,
  },
  Public: {
    label: 'Public / ETF',
    accent: '#9AA7B2',
    bg: 'rgba(154, 167, 178, 0.10)',
    icon: <BriefcaseBusiness className="h-3.5 w-3.5" />,
  },
  Unclear: {
    label: 'Kaynak Belirsiz',
    accent: '#D1736B',
    bg: 'rgba(209, 115, 107, 0.10)',
    icon: <UserRound className="h-3.5 w-3.5" />,
  },
};

const RADAR_PEOPLE: RadarPerson[] = [
  { name: 'Warren Buffett', source: '13F', role: 'Berkshire Hathaway', focus: 'Kaliteli değer, sigorta, nakit tamponu', cadence: 'Çeyreklik', confidence: 'Yüksek', note: '13F gecikmeli ama en temiz kamu portföy kaynaklarından biri.', tags: ['Value', 'Mega-cap', 'Cash'] },
  { name: 'Bill Ackman', source: '13F', role: 'Pershing Square', focus: 'Konsantre aktivist portföy', cadence: 'Çeyreklik', confidence: 'Yüksek', note: 'Az sayıda yüksek inanç pozisyonuyla okunur.', tags: ['Activist', 'Concentrated'] },
  { name: 'Cathie Wood', source: '13F', role: 'ARK Invest', focus: 'Yıkıcı teknoloji ve inovasyon', cadence: 'Çeyreklik', confidence: 'Yüksek', note: 'ETF portföyleri daha sık izlenebilir; 13F resmi taban olarak kullanılır.', tags: ['Innovation', 'Growth'] },
  { name: 'Michael Burry', source: '13F', role: 'Scion Asset Management', focus: 'Kontraryen ve makro stres okuması', cadence: 'Çeyreklik', confidence: 'Yüksek', note: 'Küçük ve hızlı değişebilen portföy olduğu için gecikme önemlidir.', tags: ['Contrarian', 'Hedge'] },
  { name: 'Larry Fink', source: '13F', role: 'BlackRock / Insider', focus: 'Kurumsal akım ve BlackRock 13F izleri', cadence: 'Çeyreklik', confidence: 'Orta', note: 'BlackRock 13F kurum seviyesidir; kişisel Form 4 ayrı okunmalı.', tags: ['Institutional', 'ETF'] },
  { name: 'Elon Musk', source: 'Form 4', role: 'Tesla / xAI / SpaceX', focus: 'Kurucu insider işlemleri ve teminat riski', cadence: 'Olay bazlı', confidence: 'Yüksek', note: 'Halka açık şirket işlemleri Form 4 üzerinden izlenir.', tags: ['Insider', 'Founder'] },
  { name: 'Michael Saylor', source: 'Form 4', role: 'Strategy / Bitcoin', focus: 'Bitcoin treasury ve insider satışları', cadence: 'Olay bazlı', confidence: 'Yüksek', note: 'MSTR ve BTC hassasiyeti birlikte okunmalı.', tags: ['Bitcoin', 'Treasury'] },
  { name: 'Jeff Bezos', source: 'Form 4', role: 'Amazon', focus: 'Kurucu satış programları', cadence: 'Olay bazlı', confidence: 'Yüksek', note: 'Planlı satışlar ile ani insider hareketleri ayrılacak.', tags: ['Founder', 'Sales'] },
  { name: 'Mark Zuckerberg', source: 'Form 4', role: 'Meta', focus: 'Kurucu oy gücü ve hisse satışları', cadence: 'Olay bazlı', confidence: 'Yüksek', note: 'Meta içindeki sinyal ağırlığı büyük ama satış programları filtrelenmeli.', tags: ['Founder', 'AI'] },
  { name: 'Jensen Huang', source: 'Form 4', role: 'NVIDIA', focus: 'AI liderliği ve insider satış temposu', cadence: 'Olay bazlı', confidence: 'Yüksek', note: 'NVDA momentumu ile planlı satışlar birlikte takip edilir.', tags: ['AI', 'Semis'] },
  { name: 'Tim Cook', source: 'Form 4', role: 'Apple', focus: 'Yönetici ödül ve satış akışı', cadence: 'Olay bazlı', confidence: 'Yüksek', note: 'Operasyonel liderlik sinyali olarak okunmalı, portföy kopyası değil.', tags: ['Mega-cap', 'Insider'] },
  { name: 'Satya Nadella', source: 'Form 4', role: 'Microsoft', focus: 'AI ve bulut liderliği insider akışı', cadence: 'Olay bazlı', confidence: 'Yüksek', note: 'MSFT ödül/satış programları ayrıca etiketlenecek.', tags: ['Cloud', 'AI'] },
  { name: 'Jamie Dimon', source: 'Form 4', role: 'JPMorgan', focus: 'Banka liderliği ve finansal stres sinyali', cadence: 'Olay bazlı', confidence: 'Yüksek', note: 'Banka hisseleri ve kredi rejimi ile beraber izlenir.', tags: ['Banks', 'Credit'] },
  { name: 'Peter Thiel', source: 'Form 4', role: 'Palantir / Founders Fund', focus: 'Kurucu satışları ve teknoloji teması', cadence: 'Olay bazlı', confidence: 'Orta', note: 'Halka açık Form 4 sinyali net; özel yatırımlar kapsama dışı.', tags: ['Defense Tech', 'Founder'] },
  { name: "Kevin O'Leary", source: 'Public', role: "O'Shares / Public Portfolio", focus: 'Temettü, kalite ve ETF temaları', cadence: 'Periyodik', confidence: 'Orta', note: 'ETF ve kamuya açık portföy mantığı ile okunacak.', tags: ['Dividend', 'Quality'] },
  { name: 'Nancy Pelosi', source: 'Congress', role: 'Kongre işlemleri', focus: 'Politik portföy ve sektör zamanlaması', cadence: 'Bildirim bazlı', confidence: 'Orta', note: 'Kongre bildirimleri gecikmeli ve eş/ailenin işlemlerini içerebilir.', tags: ['Congress', 'Tech'] },
  { name: 'Donald Trump', source: 'Congress', role: 'Kamu bildirimi / şirket ilgileri', focus: 'Siyasi varlıklar ve kamu beyanları', cadence: 'Bildirim bazlı', confidence: 'Orta', note: 'Kamu bildirimleri, şirket bağlantıları ve raporlanan varlıklar ayrılacak.', tags: ['Politics', 'Public'] },
  { name: 'JD Vance', source: 'Congress', role: 'Kongre / kamu görevlisi', focus: 'Kamu bildirimi bazlı varlık hareketleri', cadence: 'Bildirim bazlı', confidence: 'Orta', note: 'Kamu görevlisi bildirimleri gecikmeli okunur.', tags: ['Congress', 'Public'] },
  { name: 'Marjorie Taylor Greene', source: 'Congress', role: 'Kongre işlemleri', focus: 'Sektör bazlı politik portföy akışı', cadence: 'Bildirim bazlı', confidence: 'Orta', note: 'Bildirim tarihleri işlem tarihinden sonra gelebilir.', tags: ['Congress', 'Trading'] },
  { name: 'Jim Cramer', source: 'Media', role: 'Action Alerts Plus', focus: 'Model portföy ve medya etkisi', cadence: 'Program bazlı', confidence: 'Orta', note: 'Model portföy olarak izlenir; resmi insider/13F ile karıştırılmaz.', tags: ['Media', 'Model'] },
  { name: 'Brian Armstrong', source: 'Form 4', role: 'Coinbase', focus: 'Kripto hisseleri ve insider satışları', cadence: 'Olay bazlı', confidence: 'Yüksek', note: 'COIN Form 4 hareketleri kripto risk iştahı ile birlikte okunur.', tags: ['Crypto', 'Insider'] },
  { name: 'Jack Dorsey', source: 'Form 4', role: 'Block', focus: 'Fintech, Bitcoin ve kurucu işlemleri', cadence: 'Olay bazlı', confidence: 'Orta', note: 'SQ/Block ve BTC teması birlikte sınıflandırılacak.', tags: ['Fintech', 'Bitcoin'] },
  { name: 'Larry Ellison', source: 'Form 4', role: 'Oracle / Tesla', focus: 'Kurucu serveti ve büyük teknoloji pozisyonları', cadence: 'Olay bazlı', confidence: 'Orta', note: 'ORCL Form 4 net; diğer varlıklar kamu kaynaklarına göre etiketlenmeli.', tags: ['Cloud', 'Founder'] },
];

const PORTFOLIO_PREVIEWS: Record<string, { holdings: HoldingPreview[]; moves: RecentMove[] }> = {
  'Warren Buffett': {
    holdings: [
      { symbol: 'AAPL', name: 'Apple', weight: 28, stance: 'core' },
      { symbol: 'BAC', name: 'Bank of America', weight: 11, stance: 'core' },
      { symbol: 'AXP', name: 'American Express', weight: 10, stance: 'core' },
      { symbol: 'KO', name: 'Coca-Cola', weight: 8, stance: 'watch' },
    ],
    moves: [{ label: '13F gecikmeli takip', tone: 'watch' }, { label: 'Nakit tamponu izlenir', tone: 'watch' }],
  },
  'Bill Ackman': {
    holdings: [
      { symbol: 'GOOG', name: 'Alphabet', weight: 18, stance: 'core' },
      { symbol: 'HLT', name: 'Hilton', weight: 17, stance: 'core' },
      { symbol: 'CMG', name: 'Chipotle', weight: 16, stance: 'watch' },
      { symbol: 'QSR', name: 'Restaurant Brands', weight: 12, stance: 'watch' },
    ],
    moves: [{ label: 'Konsantre pozisyonlar', tone: 'watch' }, { label: 'Aktivist tema', tone: 'buy' }],
  },
  'Cathie Wood': {
    holdings: [
      { symbol: 'TSLA', name: 'Tesla', weight: 9, stance: 'core' },
      { symbol: 'COIN', name: 'Coinbase', weight: 8, stance: 'watch' },
      { symbol: 'ROKU', name: 'Roku', weight: 7, stance: 'watch' },
      { symbol: 'PATH', name: 'UiPath', weight: 5, stance: 'watch' },
    ],
    moves: [{ label: 'ETF sepeti izlenir', tone: 'watch' }, { label: 'Yüksek beta inovasyon', tone: 'buy' }],
  },
  'Michael Burry': {
    holdings: [
      { symbol: 'BABA', name: 'Alibaba', weight: 14, stance: 'watch' },
      { symbol: 'JD', name: 'JD.com', weight: 10, stance: 'watch' },
      { symbol: 'HEDGE', name: 'Put / Hedge', weight: 8, stance: 'core' },
      { symbol: 'CASH', name: 'Cash proxy', weight: 6, stance: 'watch' },
    ],
    moves: [{ label: 'Kontraryen sinyal', tone: 'watch' }, { label: 'Çeyreklik değişir', tone: 'sell' }],
  },
  'Larry Fink': {
    holdings: [
      { symbol: 'BLK', name: 'BlackRock', weight: 32, stance: 'core' },
      { symbol: 'IBIT', name: 'iShares Bitcoin Trust', weight: 10, stance: 'watch' },
      { symbol: 'SPY', name: 'US equity flow', weight: 8, stance: 'watch' },
      { symbol: 'AGG', name: 'Bond flow', weight: 7, stance: 'watch' },
    ],
    moves: [{ label: 'Kurum akımı ayrılır', tone: 'watch' }, { label: 'Form 4 ayrıca okunur', tone: 'watch' }],
  },
  'Elon Musk': {
    holdings: [
      { symbol: 'TSLA', name: 'Tesla', weight: 72, stance: 'core' },
      { symbol: 'XAI', name: 'xAI / private', weight: 12, stance: 'watch' },
      { symbol: 'SPACE', name: 'SpaceX / private', weight: 10, stance: 'watch' },
      { symbol: 'X', name: 'X / private', weight: 6, stance: 'watch' },
    ],
    moves: [{ label: 'Form 4 satışları', tone: 'sell' }, { label: 'Teminat riski takip', tone: 'watch' }],
  },
  'Michael Saylor': {
    holdings: [
      { symbol: 'MSTR', name: 'Strategy', weight: 55, stance: 'core' },
      { symbol: 'BTC', name: 'Bitcoin treasury', weight: 38, stance: 'core' },
      { symbol: 'CONV', name: 'Convertible debt', weight: 5, stance: 'watch' },
      { symbol: 'CASH', name: 'Cash buffer', weight: 2, stance: 'watch' },
    ],
    moves: [{ label: 'BTC beta ana sinyal', tone: 'buy' }, { label: 'Borçlanma izlenir', tone: 'watch' }],
  },
  'Jeff Bezos': {
    holdings: [
      { symbol: 'AMZN', name: 'Amazon', weight: 82, stance: 'core' },
      { symbol: 'BLUE', name: 'Blue Origin / private', weight: 8, stance: 'watch' },
      { symbol: 'BEZOS', name: 'Venture / private', weight: 6, stance: 'watch' },
      { symbol: 'CASH', name: 'Liquidity', weight: 4, stance: 'watch' },
    ],
    moves: [{ label: 'Planlı satış ayrılır', tone: 'sell' }, { label: 'Kurucu satış temposu', tone: 'watch' }],
  },
  'Mark Zuckerberg': {
    holdings: [
      { symbol: 'META', name: 'Meta Platforms', weight: 84, stance: 'core' },
      { symbol: 'AI', name: 'AI capex theme', weight: 8, stance: 'watch' },
      { symbol: 'VR', name: 'Reality Labs theme', weight: 5, stance: 'watch' },
      { symbol: 'CASH', name: 'Liquidity', weight: 3, stance: 'watch' },
    ],
    moves: [{ label: '10b5-1 planları izlenir', tone: 'watch' }, { label: 'AI capex hassas', tone: 'buy' }],
  },
  'Jensen Huang': {
    holdings: [
      { symbol: 'NVDA', name: 'NVIDIA', weight: 88, stance: 'core' },
      { symbol: 'AI', name: 'AI infrastructure', weight: 6, stance: 'watch' },
      { symbol: 'SEMIS', name: 'Semiconductor beta', weight: 4, stance: 'watch' },
      { symbol: 'CASH', name: 'Liquidity', weight: 2, stance: 'watch' },
    ],
    moves: [{ label: 'Planlı satış takip', tone: 'sell' }, { label: 'AI liderliği', tone: 'buy' }],
  },
  'Tim Cook': {
    holdings: [
      { symbol: 'AAPL', name: 'Apple', weight: 86, stance: 'core' },
      { symbol: 'SERV', name: 'Services theme', weight: 6, stance: 'watch' },
      { symbol: 'AI', name: 'Apple AI theme', weight: 5, stance: 'watch' },
      { symbol: 'CASH', name: 'Liquidity', weight: 3, stance: 'watch' },
    ],
    moves: [{ label: 'Ödül/satış ayrılır', tone: 'watch' }, { label: 'Mega-cap kalite', tone: 'buy' }],
  },
  'Satya Nadella': {
    holdings: [
      { symbol: 'MSFT', name: 'Microsoft', weight: 82, stance: 'core' },
      { symbol: 'AZURE', name: 'Azure theme', weight: 9, stance: 'watch' },
      { symbol: 'AI', name: 'AI platform', weight: 7, stance: 'watch' },
      { symbol: 'CASH', name: 'Liquidity', weight: 2, stance: 'watch' },
    ],
    moves: [{ label: 'Bulut ve AI teması', tone: 'buy' }, { label: 'Form 4 ayrılır', tone: 'watch' }],
  },
  'Jamie Dimon': {
    holdings: [
      { symbol: 'JPM', name: 'JPMorgan', weight: 76, stance: 'core' },
      { symbol: 'BANKS', name: 'Banking beta', weight: 10, stance: 'watch' },
      { symbol: 'CREDIT', name: 'Credit cycle', weight: 8, stance: 'watch' },
      { symbol: 'CASH', name: 'Liquidity', weight: 6, stance: 'watch' },
    ],
    moves: [{ label: 'Kredi rejimi ile okunur', tone: 'watch' }, { label: 'Banka liderliği', tone: 'buy' }],
  },
  'Peter Thiel': {
    holdings: [
      { symbol: 'PLTR', name: 'Palantir', weight: 42, stance: 'core' },
      { symbol: 'DEF', name: 'Defense tech', weight: 18, stance: 'watch' },
      { symbol: 'VC', name: 'Private venture', weight: 25, stance: 'watch' },
      { symbol: 'CASH', name: 'Liquidity', weight: 15, stance: 'watch' },
    ],
    moves: [{ label: 'Özel yatırımlar kapsama dışı', tone: 'watch' }, { label: 'Form 4 net sinyal', tone: 'watch' }],
  },
  "Kevin O'Leary": {
    holdings: [
      { symbol: 'OUSA', name: "O'Shares USA Quality", weight: 34, stance: 'core' },
      { symbol: 'DIV', name: 'Dividend quality', weight: 22, stance: 'core' },
      { symbol: 'BTC', name: 'Crypto allocation', weight: 8, stance: 'watch' },
      { symbol: 'CASH', name: 'Cash', weight: 6, stance: 'watch' },
    ],
    moves: [{ label: 'ETF/model portföy', tone: 'watch' }, { label: 'Kalite-temettü', tone: 'buy' }],
  },
  'Nancy Pelosi': {
    holdings: [
      { symbol: 'NVDA', name: 'NVIDIA', weight: 24, stance: 'watch' },
      { symbol: 'AAPL', name: 'Apple', weight: 18, stance: 'watch' },
      { symbol: 'MSFT', name: 'Microsoft', weight: 16, stance: 'watch' },
      { symbol: 'OPTIONS', name: 'Options disclosure', weight: 12, stance: 'watch' },
    ],
    moves: [{ label: 'Gecikmeli bildirim', tone: 'watch' }, { label: 'Aile işlemleri ayrılır', tone: 'watch' }],
  },
  'Donald Trump': {
    holdings: [
      { symbol: 'DJT', name: 'Trump Media', weight: 44, stance: 'core' },
      { symbol: 'REAL', name: 'Real estate', weight: 22, stance: 'watch' },
      { symbol: 'BONDS', name: 'Fixed income', weight: 10, stance: 'watch' },
      { symbol: 'CASH', name: 'Cash / trusts', weight: 8, stance: 'watch' },
    ],
    moves: [{ label: 'Kamu beyanları ayrılır', tone: 'watch' }, { label: 'Siyasi risk etiketi', tone: 'watch' }],
  },
  'JD Vance': {
    holdings: [
      { symbol: 'INDEX', name: 'Index funds', weight: 28, stance: 'watch' },
      { symbol: 'VC', name: 'Private funds', weight: 22, stance: 'watch' },
      { symbol: 'BONDS', name: 'Bonds', weight: 12, stance: 'watch' },
      { symbol: 'CASH', name: 'Cash', weight: 8, stance: 'watch' },
    ],
    moves: [{ label: 'Kamu bildirimi bazlı', tone: 'watch' }, { label: 'Aralıklı raporlama', tone: 'watch' }],
  },
  'Marjorie Taylor Greene': {
    holdings: [
      { symbol: 'TECH', name: 'Tech basket', weight: 22, stance: 'watch' },
      { symbol: 'ENERGY', name: 'Energy basket', weight: 16, stance: 'watch' },
      { symbol: 'DEF', name: 'Defense basket', weight: 14, stance: 'watch' },
      { symbol: 'CASH', name: 'Cash', weight: 8, stance: 'watch' },
    ],
    moves: [{ label: 'Sektör zamanlaması', tone: 'watch' }, { label: 'Bildirim gecikmeli', tone: 'watch' }],
  },
  'Jim Cramer': {
    holdings: [
      { symbol: 'AAPL', name: 'Apple', weight: 10, stance: 'watch' },
      { symbol: 'NVDA', name: 'NVIDIA', weight: 9, stance: 'watch' },
      { symbol: 'MSFT', name: 'Microsoft', weight: 8, stance: 'watch' },
      { symbol: 'CASH', name: 'Cash position', weight: 6, stance: 'watch' },
    ],
    moves: [{ label: 'Model portföy', tone: 'watch' }, { label: 'Medya etkisi ayrılır', tone: 'watch' }],
  },
  'Brian Armstrong': {
    holdings: [
      { symbol: 'COIN', name: 'Coinbase', weight: 78, stance: 'core' },
      { symbol: 'BTC', name: 'Bitcoin beta', weight: 9, stance: 'watch' },
      { symbol: 'USDC', name: 'Stablecoin theme', weight: 7, stance: 'watch' },
      { symbol: 'CASH', name: 'Liquidity', weight: 6, stance: 'watch' },
    ],
    moves: [{ label: 'Form 4 satışları', tone: 'sell' }, { label: 'Kripto beta', tone: 'buy' }],
  },
  'Jack Dorsey': {
    holdings: [
      { symbol: 'XYZ', name: 'Block', weight: 52, stance: 'core' },
      { symbol: 'BTC', name: 'Bitcoin theme', weight: 20, stance: 'core' },
      { symbol: 'FINTECH', name: 'Fintech beta', weight: 12, stance: 'watch' },
      { symbol: 'CASH', name: 'Liquidity', weight: 6, stance: 'watch' },
    ],
    moves: [{ label: 'Fintech + BTC', tone: 'watch' }, { label: 'Form 4 izlenir', tone: 'watch' }],
  },
  'Larry Ellison': {
    holdings: [
      { symbol: 'ORCL', name: 'Oracle', weight: 62, stance: 'core' },
      { symbol: 'TSLA', name: 'Tesla legacy', weight: 16, stance: 'watch' },
      { symbol: 'CLOUD', name: 'Cloud theme', weight: 12, stance: 'watch' },
      { symbol: 'CASH', name: 'Liquidity', weight: 10, stance: 'watch' },
    ],
    moves: [{ label: 'ORCL ana sinyal', tone: 'buy' }, { label: 'Diğer varlıklar kamu dışı', tone: 'watch' }],
  },
};

function portfolioFor(person: RadarPerson) {
  return PORTFOLIO_PREVIEWS[person.name] ?? {
    holdings: [
      { symbol: 'TBD', name: 'Kaynak bağlanacak', weight: 100, stance: 'watch' as const },
    ],
    moves: [{ label: 'Veri bağlantısı bekliyor', tone: 'watch' as const }],
  };
}

function stanceMeta(stance: HoldingPreview['stance']) {
  if (stance === 'core') return { label: 'Ana', color: '#72D39A' };
  if (stance === 'added') return { label: 'Eklendi', color: '#7FB4FF' };
  if (stance === 'trimmed') return { label: 'Azaldı', color: '#D1736B' };
  return { label: 'İzle', color: '#F1B84A' };
}

function moveColor(tone: RecentMove['tone']) {
  if (tone === 'buy') return '#72D39A';
  if (tone === 'sell') return '#D1736B';
  return '#F1B84A';
}

function detailedHoldings(holdings: HoldingPreview[]) {
  const fillers: HoldingPreview[] = [
    { symbol: 'CASH', name: 'Nakit / Likidite', weight: 5, stance: 'watch' },
    { symbol: 'THEME', name: 'Tema Sepeti', weight: 4, stance: 'watch' },
    { symbol: 'HEDGE', name: 'Korunma / Hedge', weight: 3, stance: 'watch' },
    { symbol: 'ALT', name: 'Alternatif Varlık', weight: 2, stance: 'watch' },
  ];
  const symbols = new Set(holdings.map((holding) => holding.symbol));
  const additions = fillers.filter((holding) => !symbols.has(holding.symbol));
  return holdings.concat(additions).slice(0, 6);
}

const PRIMARY_FILTERS: Array<{ id: PrimaryFilter; label: string }> = [
  { id: 'All', label: 'Hepsi' },
  { id: 'Funds', label: 'Hedge Fon Yöneticileri' },
  { id: 'Tech', label: "Tech CEO'ları" },
  { id: 'Politics', label: 'Politikacılar' },
  { id: 'Media', label: 'Medya / TV Figürleri' },
];

const LAST_ACTIONS: Record<string, ActionSignal> = {
  'Warren Buffett': { text: '2 gün önce · AAPL ağırlığı izleniyor · 13F gecikmeli', tone: 'watch', date: '2g önce', source: '13F' },
  'Bill Ackman': { text: '4 gün önce · GOOGL pozisyonu öne çıktı · ~$420M', tone: 'buy', date: '4g önce', source: '13F' },
  'Cathie Wood': { text: '1 gün önce · TSLA artırımı izleniyor · ARK sepeti', tone: 'buy', date: '1g önce', source: '13F' },
  'Michael Burry': { text: 'Bu hafta · SPY put opsiyonları aldı · Scion Asset Management', tone: 'buy', date: 'Bu hafta', source: '13F' },
  'Larry Fink': { text: 'Bu hafta · IBIT akışı güçlendi · BlackRock teması', tone: 'buy', date: 'Bu hafta', source: '13F' },
  'Elon Musk': { text: '2 gün önce · TSLA Form 4 satışı takipte · planlı işlem', tone: 'sell', date: '2g önce', source: 'Form 4' },
  'Michael Saylor': { text: '3 gün önce · MSTR/BTC beta yükseldi · treasury sinyali', tone: 'buy', date: '3g önce', source: 'Form 4' },
  'Jeff Bezos': { text: '5 gün önce · AMZN satış programı izleniyor · Form 4', tone: 'sell', date: '5g önce', source: 'Form 4' },
  'Mark Zuckerberg': { text: 'Bu hafta · META satış planı ayrıştırıldı · 10b5-1', tone: 'watch', date: 'Bu hafta', source: 'Form 4' },
  'Jensen Huang': { text: 'Bu hafta · NVDA planlı satışları kümelendi · Form 4', tone: 'sell', date: 'Bu hafta', source: 'Form 4' },
  'Tim Cook': { text: '6 gün önce · AAPL ödül/satış akışı güncellendi', tone: 'watch', date: '6g önce', source: 'Form 4' },
  'Satya Nadella': { text: 'Bu hafta · MSFT insider akışı nötr · AI/bulut odağı', tone: 'watch', date: 'Bu hafta', source: 'Form 4' },
  'Jamie Dimon': { text: 'Bu hafta · JPM pozisyonu kredi rejimiyle izleniyor', tone: 'watch', date: 'Bu hafta', source: 'Form 4' },
  'Peter Thiel': { text: '7 gün önce · PLTR kurucu hareketi takipte · Form 4', tone: 'watch', date: '7g önce', source: 'Form 4' },
  "Kevin O'Leary": { text: 'Bu hafta · kalite/temettü sepeti güncellendi · ETF', tone: 'buy', date: 'Bu hafta', source: 'Public' },
  'Nancy Pelosi': { text: '3 gün önce · NVDA/MSFT bildirimi radarda · kongre', tone: 'buy', date: '3g önce', source: 'Congress' },
  'Donald Trump': { text: 'Bu hafta · DJT ve kamu beyanları ayrı izleniyor', tone: 'watch', date: 'Bu hafta', source: 'Congress' },
  'JD Vance': { text: 'Bu hafta · kamu bildirimi bekleniyor · aralıklı rapor', tone: 'watch', date: 'Bu hafta', source: 'Congress' },
  'Marjorie Taylor Greene': { text: '2 gün önce · savunma/enerji sepeti bildirimi · kongre', tone: 'buy', date: '2g önce', source: 'Congress' },
  'Jim Cramer': { text: '1 gün önce · model portföyde NVDA izleniyor · AAP', tone: 'watch', date: '1g önce', source: 'Media' },
  'Brian Armstrong': { text: 'Bu hafta · COIN Form 4 satışları ayrıştırıldı', tone: 'sell', date: 'Bu hafta', source: 'Form 4' },
  'Jack Dorsey': { text: 'Bu hafta · Block ve BTC teması güncellendi', tone: 'watch', date: 'Bu hafta', source: 'Form 4' },
  'Larry Ellison': { text: 'Bu hafta · ORCL ana pozisyon sinyali güçlü', tone: 'buy', date: 'Bu hafta', source: 'Form 4' },
};

function primaryGroupFor(person: RadarPerson): PrimaryFilter {
  if (person.source === '13F') return 'Funds';
  if (person.source === 'Congress') return 'Politics';
  if (person.source === 'Media') return 'Media';
  if (['Elon Musk', 'Michael Saylor', 'Jeff Bezos', 'Mark Zuckerberg', 'Jensen Huang', 'Tim Cook', 'Satya Nadella', 'Brian Armstrong', 'Jack Dorsey', 'Larry Ellison', 'Peter Thiel'].includes(person.name)) return 'Tech';
  return 'All';
}

function confidenceColor(confidence: RadarPerson['confidence']) {
  if (confidence === 'Yüksek') return '#72D39A';
  if (confidence === 'Orta') return '#F1B84A';
  return '#D1736B';
}

export function PortfolioRadarPage() {
  const [activePrimary, setActivePrimary] = useState<PrimaryFilter>('All');
  const [activeSource, setActiveSource] = useState<'All' | PortfolioSource>('All');
  const [query, setQuery] = useState('');
  const [selectedName, setSelectedName] = useState('Warren Buffett');

  const filteredPeople = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return RADAR_PEOPLE.filter((person) => {
      if (person.source === 'Unclear') return false;
      const primaryMatch = activePrimary === 'All' || primaryGroupFor(person) === activePrimary;
      const sourceMatch = activeSource === 'All' || person.source === activeSource;
      const queryMatch = !lowerQuery
        || person.name.toLowerCase().includes(lowerQuery)
        || person.role.toLowerCase().includes(lowerQuery)
        || person.tags.some((tag) => tag.toLowerCase().includes(lowerQuery));
      return primaryMatch && sourceMatch && queryMatch;
    });
  }, [activePrimary, activeSource, query]);

  const activePeople = RADAR_PEOPLE.filter((person) => person.source !== 'Unclear');
  const featuredAction = LAST_ACTIONS['Michael Burry'];
  const selectedPerson = RADAR_PEOPLE.find((person) => person.name === selectedName) ?? activePeople[0];
  const selectedPortfolio = selectedPerson ? portfolioFor(selectedPerson) : null;
  const selectedAction = selectedPerson ? LAST_ACTIONS[selectedPerson.name] : null;
  const summaryCards = [
    { label: 'Bugün', value: '6 işlem', detail: 'Son 24 saat placeholder', accent: '#72D39A' },
    { label: 'Bu hafta', value: '31 işlem', detail: 'Son 7 gün placeholder', accent: '#F1B84A' },
    { label: 'En aktif', value: 'Jensen Huang', detail: '7 günde 4 Form 4 sinyali', accent: '#7FB4FF' },
    { label: 'Öne çıkan', value: 'NVDA satış', detail: '3 insider hareketi', accent: '#D1736B' },
  ];

  return (
    <div className="space-y-5">
      <section className="premium-accent-panel relative overflow-hidden rounded-sm border border-[#1F1F1F] bg-[#111111]">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,#F1B84A_0%,#72D39A_45%,#7FB4FF_100%)]" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#F1B84A]/[0.08] blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-[#72D39A]/[0.06] blur-3xl" />
        <div className="relative grid gap-5 p-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-sm border border-[#F1B84A]/25 bg-[#F1B84A]/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-[#F1B84A]">
              <Crown className="h-3.5 w-3.5" />
              Portföy Radar
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#F5F7FA]">
              Ünlü yatırımcı, insider ve kamu portföy hareketlerini tek ekranda izle.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#A7B0BA]">
              Bu ilk versiyon kaynak tiplerini ayırır: 13F gecikmeli kurumsal portföyler, Form 4 insider işlemleri,
              kongre bildirimleri, medya/model portföyleri ve kaynağı henüz net olmayan izleme listeleri.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {summaryCards.map((item) => (
              <div key={item.label} className="rounded-sm border border-[#1F1F1F] bg-[#0D0F12] p-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#66707A]">{item.label}</div>
                <div className="mt-2 truncate font-mono text-lg font-semibold tabular-nums tracking-[-0.02em]" style={{ color: item.accent }}>
                  {item.value}
                </div>
                <div className="mt-1 truncate text-[11px] text-[#66707A]">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="premium-accent-panel rounded-sm border border-[#1F1F1F] bg-[#111111]">
        <div className="flex flex-col gap-4 border-b border-[#1A1A1A] p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {PRIMARY_FILTERS.map((filter) => {
                  const active = activePrimary === filter.id;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setActivePrimary(filter.id)}
                      className="rounded-sm border px-3 py-2 text-[10px] font-mono uppercase tracking-[0.14em] transition-colors"
                      style={{
                        color: active ? '#F5F7FA' : '#8E959D',
                        borderColor: active ? '#F1B84A66' : '#252A30',
                        backgroundColor: active ? 'rgba(241,184,74,0.10)' : '#0D0F12',
                      }}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex min-w-[240px] items-center gap-2 rounded-sm border border-[#252A30] bg-[#0D0F12] px-3 py-2">
              <Search className="h-3.5 w-3.5 text-[#66707A]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="İsim, rol veya tema ara..."
                className="w-full bg-transparent text-[12px] text-[#D8DEE4] outline-none placeholder:text-[#58616B]"
              />
            </div>
          </div>
        </div>

        <div className="border-b border-[#1A1A1A] bg-[#0B0D10] p-4">
          <div className="relative overflow-hidden rounded-sm border border-[#2A2417] bg-[linear-gradient(135deg,rgba(241,184,74,0.12),rgba(13,15,18,0.96)_42%,rgba(114,211,154,0.08))] p-5">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#F1B84A]/10 blur-3xl" />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#F1B84A]">Bu hafta öne çıkan</div>
                <h2 className="mt-2 text-xl font-semibold text-[#F5F7FA]">{featuredAction.text}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#8E959D]">
                  <span>{featuredAction.date}</span>
                  <span className="text-[#3A414A]">/</span>
                  <span
                    className="rounded-sm border px-2 py-1 font-mono uppercase tracking-[0.12em]"
                    style={{
                      color: SOURCE_META[featuredAction.source].accent,
                      borderColor: `${SOURCE_META[featuredAction.source].accent}40`,
                      backgroundColor: SOURCE_META[featuredAction.source].bg,
                    }}
                  >
                    {SOURCE_META[featuredAction.source].label}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="inline-flex w-fit items-center gap-2 rounded-sm border border-[#F1B84A]/35 bg-[#F1B84A]/10 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.14em] text-[#F1B84A]"
              >
                Detayları gör
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {selectedPerson && selectedPortfolio && selectedAction && (
          <div className="border-b border-[#1A1A1A] bg-[#0B0D10] p-4">
            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.35fr]">
              <div className="relative overflow-hidden rounded-sm border border-[#252A30] bg-[#101318] p-4">
                <div
                  className="absolute inset-y-0 left-0 w-[3px]"
                  style={{ backgroundColor: SOURCE_META[selectedPerson.source].accent }}
                />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#66707A]">
                      Seçili radar profili
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold text-[#F5F7FA]">{selectedPerson.name}</h2>
                    <p className="mt-1 text-sm text-[#A7B0BA]">{selectedPerson.role}</p>
                  </div>
                  <span
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.12em]"
                    style={{
                      borderColor: `${SOURCE_META[selectedPerson.source].accent}45`,
                      color: SOURCE_META[selectedPerson.source].accent,
                      backgroundColor: SOURCE_META[selectedPerson.source].bg,
                    }}
                  >
                    {SOURCE_META[selectedPerson.source].icon}
                    {SOURCE_META[selectedPerson.source].label}
                  </span>
                </div>

                <div
                  className="mt-4 rounded-sm border px-3 py-2 font-mono text-[12px] leading-relaxed"
                  style={{
                    color: moveColor(selectedAction.tone),
                    borderColor: `${moveColor(selectedAction.tone)}35`,
                    backgroundColor: `${moveColor(selectedAction.tone)}10`,
                  }}
                >
                  {selectedAction.text}
                </div>

                <p className="mt-4 text-[12px] leading-relaxed text-[#8E959D]">{selectedPerson.focus}</p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-sm border border-[#1A1F24] bg-[#0B0D10] p-3">
                    <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-[#58616B]">Güncelleme</div>
                    <div className="mt-1 text-[12px] text-[#D8DEE4]">{selectedPerson.cadence}</div>
                  </div>
                  <div className="rounded-sm border border-[#1A1F24] bg-[#0B0D10] p-3">
                    <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-[#58616B]">Güven</div>
                    <div className="mt-1 text-[12px] font-semibold" style={{ color: confidenceColor(selectedPerson.confidence) }}>
                      {selectedPerson.confidence}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="overflow-hidden rounded-sm border bg-[#101318]"
                style={{
                  borderColor: 'transparent',
                  background: 'linear-gradient(#101318, #101318) padding-box, linear-gradient(120deg, #F1B84A, #72D39A, #7FB4FF, #C7A36A, #D1736B, #8F7CFF) border-box',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 18px 52px rgba(0,0,0,0.24)',
                }}
              >
                <div className="flex items-center justify-between gap-3 border-b border-[#1A1F24] px-4 py-3">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#66707A]">Radar portföyü</div>
                    <div className="mt-1 text-sm font-semibold text-[#F5F7FA]">İlk 6 pozisyon ve sinyal okuması</div>
                  </div>
                  <div className="rounded-sm border border-[#1A1F24] bg-[#0B0D10] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8E959D]">
                    6 varlık
                  </div>
                </div>
                <div className="grid grid-cols-[1.15fr_0.6fr_0.7fr_1fr] gap-2 border-b border-[#1A1F24] px-4 py-3 text-[10px] font-mono uppercase tracking-[0.16em] text-[#66707A]">
                  <span>Pozisyon</span>
                  <span>Ağırlık</span>
                  <span>Durum</span>
                  <span>Son sinyal</span>
                </div>
                <div className="divide-y divide-[#151A1F]">
                  {detailedHoldings(selectedPortfolio.holdings).map((holding) => {
                    const stance = stanceMeta(holding.stance);
                    return (
                      <div
                        key={`${selectedPerson.name}-${holding.symbol}`}
                        className="grid grid-cols-[1.15fr_0.6fr_0.7fr_1fr] items-center gap-2 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-[#F3F4F6]">{holding.name}</div>
                          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#66707A]">
                            {holding.symbol}
                          </div>
                        </div>
                        <div className="font-mono text-sm font-semibold tabular-nums text-[#D8DEE4]">
                          %{holding.weight}
                        </div>
                        <div>
                          <span
                            className="rounded-sm border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.12em]"
                            style={{ borderColor: `${stance.color}40`, color: stance.color, backgroundColor: `${stance.color}12` }}
                          >
                            {stance.label}
                          </span>
                        </div>
                        <div className="text-[12px] leading-relaxed text-[#8E959D]">
                          {selectedAction.date} · {SOURCE_META[selectedAction.source].label} · {selectedPerson.cadence}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPeople.map((person) => {
            const meta = SOURCE_META[person.source];
            const confidence = confidenceColor(person.confidence);
            const portfolio = portfolioFor(person);
            const selected = selectedPerson?.name === person.name;
            const action = LAST_ACTIONS[person.name] ?? {
              text: 'Veri bağlantısı bekliyor · son işlem placeholder',
              tone: 'watch' as const,
              date: 'Beklemede',
              source: person.source,
            };
            const actionColor = moveColor(action.tone);
            return (
              <article
                key={person.name}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedName(person.name)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedName(person.name);
                  }
                }}
                className="group relative min-h-[355px] cursor-pointer overflow-hidden rounded-sm border bg-[#0D0F12] text-left transition-all hover:-translate-y-[1px] hover:border-[#2F363E]"
                style={{
                  borderColor: selected ? 'transparent' : '#1F1F1F',
                  background: selected
                    ? `linear-gradient(#0D0F12, #0D0F12) padding-box, linear-gradient(120deg, #F1B84A, #72D39A, #7FB4FF, #C7A36A, #D1736B, #8F7CFF) border-box`
                    : '#0D0F12',
                  boxShadow: selected ? '0 0 0 1px rgba(255,255,255,0.08), 0 18px 52px rgba(0,0,0,0.34)' : undefined,
                }}
              >
                <div className="absolute inset-x-0 top-0 h-[2px]" style={{ backgroundColor: meta.accent }} />
                {selected && (
                  <div
                    className="absolute right-3 top-3 rounded-sm border px-2 py-1 text-[8px] font-mono uppercase tracking-[0.12em]"
                    style={{ borderColor: `${meta.accent}45`, color: meta.accent, backgroundColor: meta.bg }}
                  >
                    Seçili
                  </div>
                )}
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl" style={{ backgroundColor: `${meta.accent}18` }} />
                <div className="relative flex h-full flex-col">
                  <div className="p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border font-mono text-sm font-semibold"
                        style={{ borderColor: `${meta.accent}45`, backgroundColor: meta.bg, color: meta.accent }}
                      >
                        {person.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold text-[#F5F7FA]">{person.name}</h2>
                        <p className="mt-0.5 truncate text-[12px] text-[#8E959D]">{person.role}</p>
                      </div>
                    </div>

                    <div
                      className="mt-4 rounded-sm border px-3 py-2 font-mono text-[11px] leading-relaxed"
                      style={{ borderColor: `${actionColor}35`, color: actionColor, backgroundColor: `${actionColor}10` }}
                    >
                      {action.text}
                    </div>

                    <div className="mt-4 rounded-sm border border-[#1A1F24] bg-[#090B0E] p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-[#66707A]">
                          Portföy önizleme
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-[#66707A] transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <div className="space-y-2">
                        {portfolio.holdings.slice(0, 3).map((holding) => {
                          const stance = stanceMeta(holding.stance);
                          return (
                            <div key={`${person.name}-${holding.symbol}-preview`} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 text-[11px]">
                              <span className="truncate font-semibold text-[#D8DEE4]">{holding.symbol}</span>
                              <span className="font-mono tabular-nums text-[#8E959D]">%{holding.weight}</span>
                              <span className="font-mono uppercase tracking-[0.1em]" style={{ color: stance.color }}>
                                {stance.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto border-t border-[#1A1F24] bg-[#0B0D10]/80 p-4 text-[#66707A]">
                    <p className="text-[12px] leading-relaxed text-[#7A838D]">{person.focus}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-[#58616B]">Güncelleme</div>
                        <div className="mt-1 text-[11px] text-[#8E959D]">{person.cadence}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-[#58616B]">Güven</div>
                        <div className="mt-1 text-[11px] font-semibold" style={{ color: confidence }}>{person.confidence}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[9px] font-mono uppercase tracking-[0.12em]"
                        style={{ borderColor: `${meta.accent}30`, color: meta.accent, backgroundColor: meta.bg }}
                      >
                        {meta.icon}
                        {meta.label}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {person.tags.map((tag) => (
                        <span key={tag} className="rounded-sm border border-[#1A1F24] bg-[#11161B] px-2 py-1 text-[9px] font-mono uppercase tracking-[0.12em] text-[#66707A]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <div className="border-t border-[#1A1A1A] px-4 py-3 text-[11px] leading-relaxed text-[#66707A]">
          Portföy Radar yatırım tavsiyesi değildir. 13F ve kamu görevlisi bildirimleri gecikmeli olabilir; Form 4 işlemleri ise kişi portföyünün tamamını değil sadece ilgili halka açık şirket işlemlerini gösterir.
        </div>
      </section>
    </div>
  );
}

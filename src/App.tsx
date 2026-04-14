/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { ArrowDown, ArrowUp, Minus, RefreshCw, Home, AlertTriangle, Activity, Layers3, ShieldAlert, Radar, Landmark, Cpu, Wheat, Gem, TrendingUp, BarChart3 } from 'lucide-react';
import { syncMetric } from './workers/syncMetric';
import { runScoringEngine } from './workers/scoringWorker';
import { runAlertEngine } from './workers/alertWorker';
import { generateCategoryInsight, generateMarketOverview } from './workers/aiWorker';
import { supabase } from './lib/supabase';
import { useDashboardData, type DashboardData } from './hooks/useDashboardData';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { FED_POWER_CATEGORY_ID } from './data/fedProfiles';
import { CryptoPage } from './components/CryptoPage';

const CRYPTO_CATEGORY_ID = '30000000-0000-0000-0000-000000000011';
const ALERTS_SECTION_ID = 'alerts';
const DIVERGENCES_SECTION_ID = 'divergences';
const SETTINGS_SECTION_ID = 'settings';
const COOLDOWN_SECTION_ID = 'cooldown';
const APP_SETTINGS_KEY = 'mergen-ui-settings';

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
const NEWS_SECTION_ID = 'news';
const UTILITY_SECTION_IDS = [NEWS_SECTION_ID, ALERTS_SECTION_ID, DIVERGENCES_SECTION_ID, SETTINGS_SECTION_ID, COOLDOWN_SECTION_ID] as const;

type AppSettings = {
  theme: 'dark' | 'graphite' | 'light';
  reducedMotion: boolean;
  guideDefaultOpen: boolean;
  showMetricDates: boolean;
  compactText: boolean;
  showLegalNote: boolean;
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  reducedMotion: false,
  guideDefaultOpen: false,
  showMetricDates: true,
  compactText: false,
  showLegalNote: true,
};
const SYNC_CONCURRENCY = 6;

type MetricGroup = {
  title: string;
  description: string;
  symbols: string[];
};

const CATEGORY_GROUPS: Record<string, MetricGroup[]> = {
  '30000000-0000-0000-0000-000000000001': [
    { title: 'Ekonomik Baskı', description: 'Hanehalkı üzerindeki doğrudan mali sıkışma ve yaşam maliyeti baskısı.', symbols: ['MISERY_INDEX', 'LNS14024887', 'REAL_WAGE_BOTTOM25', 'FOOD_HEADLINE_SPREAD', 'HOUSING_TO_INCOME'] },
    { title: 'Toplumsal Duyarlılık', description: 'Beklentiler, memnuniyet ve sistemden kopuş eğilimi.', symbols: ['UMCSENT', 'WHR_SCORE', 'SOCIAL_MOBILITY_INDEX', 'PUBLIC_SERVICES_SENTIMENT', 'ELITE_OVERPRODUCTION'] },
    { title: 'Kurumlar ve Güven', description: 'Hukuk, medya ve kurumlara dönük güven zemini.', symbols: ['VDEM_LDI', 'EDELMAN_TRUST', 'CORRUPTION_PERCEPTIONS', 'RULE_OF_LAW_SCORE', 'PRESS_FREEDOM_SCORE', 'CIVIL_SOCIETY_STRENGTH'] },
    { title: 'Eşitsizlik ve Gerilim', description: 'Gelir/servet dağılımı ve politik-sosyal çatlaklar.', symbols: ['WID_TOP10_SHARE', 'WID_BOTTOM50_SHARE', 'NET_INCOME_GINI', 'POLITICAL_POLARIZATION', 'MIGRANT_INTEGRATION_STRESS', 'CORNELL_STRIKES', 'MAINSTREAM_VOTE_LOSS'] },
    { title: 'Demografik ve Yaşam Kalitesi', description: 'Beyin göçü, borç-servet dengesi ve reel refah aşınması.', symbols: ['BRAIN_DRAIN_INDEX', 'MIDDLE_CLASS_DEBT_WEALTH_RATIO', 'REAL_HOUSEHOLD_NET_WORTH_CHANGE'] },
  ],
  '30000000-0000-0000-0000-000000000002': [
    { title: 'Liderler ve Breadth', description: 'Mega-cap liderliği ve dijital ekonominin geniş tabana yayılımı.', symbols: ['MAGS', 'QQQ_TECH', 'IGV', 'PNQI', 'BOTZ', 'CLOU', 'SAAS_REVENUE_GROWTH'] },
    { title: 'AI ve Hesaplama Omurgası', description: 'Çip, capex ve fikri mülkiyet üzerinden inovasyonun çekirdeği.', symbols: ['SMH', 'NVDA', 'TSM', 'TSMC_ADV_NODE_SHARE', 'AI_CAPEX_HYPERSCALERS', 'AI_PATENT_FILINGS', 'CORPORATE_RD_INTENSITY'] },
    { title: 'Fiziksel Altyapı ve Enerji', description: 'Veri merkezi, elektrik ve kritik girdi darboğazları.', symbols: ['HG=F', 'LIT', 'URA', 'EQIX', 'IEA_DC_POWER_DEMAND', 'RENEWABLE_ENERGY_MIX'] },
    { title: 'Savunma, Devlet ve Açık Kaynak', description: 'Siber güvenlik, kamu teknolojisi ve açık kaynak adaptasyonu.', symbols: ['CIBR', 'PLTR', 'OPEN_SOURCE_AI_ACTIVITY', 'STRATEGIC_VALUE_INDEX'] },
    { title: 'Risk ve Anlatı', description: 'Yüksek beta teknoloji sermayesi ve anlatı iştahı.', symbols: ['BTC', 'ARKK_TECH'] },
    { title: 'AI Operasyonel Verimlilik', description: 'GPU, bellek, geliştirici verimi ve kuantum patent ivmesi.', symbols: ['GPU_RENTAL_PRICE_INDEX', 'HBM_PRICE_INDEX', 'AI_DEV_PRODUCTIVITY_INDEX', 'QUANTUM_PATENT_VELOCITY'] },
  ],
  '30000000-0000-0000-0000-000000000003': [
    { title: 'Kurumsal Güç Dengesi', description: 'Kurulun kökeni, lobi ağları ve Wall Street temasları.', symbols: ['FED_GOV_ORIGIN_SCORE', 'FED_POLITICAL_TILT', 'FED_THINK_TANK_DENSITY', 'FED_REVOLVING_DOOR', 'NYFED_WALLSTREET_LINKAGE', 'FED_PRIMARY_DEALER_INFLUENCE'] },
    { title: 'Söylem ve Muhalefet', description: 'İçerideki ton değişimi, muhalif oylar ve siyasi baskı.', symbols: ['FED_HAWK_DOVE_SCORE', 'FED_SPEAK_SENTIMENT_MOMENTUM', 'FOMC_DISSENT_INDEX', 'CONGRESSIONAL_AGGRESSION_SCORE'] },
    { title: 'Politika Sapması ve Bölgesel Ayrışma', description: 'Fed’in kural setinden sapması ve bölgeler arası görüş farkı.', symbols: ['POLICY_RULE_DEVIATION', 'DISTRICT_GROWTH_DISPERSION', 'SHADOW_RATE_GAP', 'FED_SECTOR_MEETING_CONCENTRATION'] },
    { title: 'Bilanço ve Denetim', description: 'IORB arbitrajı ve Beige Book belirsizlik tonu üzerinden kurumsal gerilim.', symbols: ['IORB_MARKET_ARBITRAGE', 'BEIGE_BOOK_UNCERTAINTY_FREQ'] },
  ],
  '30000000-0000-0000-0000-000000000004': [
    { title: 'Ana Akımlar', description: 'Sermayenin ana ETF ekseninde nereye aktığını gösterir.', symbols: ['SPY', 'QQQ', 'XLF', 'XLE', 'ARKK', 'IBIT'] },
    { title: 'Piyasa Genişliği ve Nakit', description: 'Rallinin tabana yayılımı ve kenarda bekleyen nakit.', symbols: ['RSP_SPY_RATIO', 'WMFSL', 'ETF_FLOW_PRESSURE', 'BOND_EQUITY_FLOW_RATIO'] },
    { title: 'Opsiyon ve Kısa Pozisyon', description: 'Korunma maliyeti, squeeze riski ve duyarlılık aşırılıkları.', symbols: ['OPTIONS_POSITIONING', 'ETF_SHORT_INTEREST_RATIO', 'ETF_PUT_CALL_SKEW', 'VIX_OPTION_SPX_OPTION_RATIO'] },
    { title: 'Kurumsal Akış', description: 'Büyük oyuncuların sessiz birikimi ve yoğunlaşma davranışı.', symbols: ['DARK_POOL_BUY_VOLUME', 'WHALE_13F_CONCENTRATION'] },
  ],
  '30000000-0000-0000-0000-000000000005': [
    { title: 'Ana Metaller', description: 'Altın, gümüş ve platin grubunun doğrudan fiyat davranışı.', symbols: ['GLD', 'SLV', 'PPLT', 'PALL', 'GOLD_SILVER_INDEX'] },
    { title: 'Makro Oranlar', description: 'Reel faizler, riskli varlıklar, enerji ve metal ayrışmasıyla kurulan makro ilişki.', symbols: ['GOLD_REAL_RATE_SIGNAL', 'GOLD_SPY_RATIO', 'GOLD_OIL_RATIO', 'GOLD_SILVER_RATIO_PM'] },
    { title: 'Madenciler ve Pozisyonlama', description: 'Madenci hisseleri ve hedge fonlarının yönelimi.', symbols: ['GDX', 'SIL', 'COT_NET_SPEC_POSITION'] },
    { title: 'Fiziksel Talep ve Arz', description: 'Merkez bankası talebi, teslimat stoku ve fiziki arbitraj sinyali.', symbols: ['CENTRAL_BANK_GOLD_BUYING', 'COMEX_REGISTERED_STOCKS', 'US_MINT_BULLION_SALES', 'PHYSICAL_SILVER_PREMIUM', 'SHANGHAI_LONDON_GOLD_PREMIUM', 'INDIA_GOLD_IMPORT_VOLUME'] },
  ],
  '30000000-0000-0000-0000-000000000006': [
    { title: 'Temel Tahıllar', description: 'Buğday, mısır, soya ve ikincil tahıllar üzerinden çekirdek gıda arzı.', symbols: ['WEAT', 'CORN', 'SOYB', 'BARLEY_FUTURES', 'OAT_FUTURES', 'ROUGH_RICE_FUTURES'] },
    { title: 'Protein ve İşlenmiş Gıda', description: 'Et, süt ve işlenmiş ürün zincirindeki fiyat baskısı.', symbols: ['LIVE_CATTLE_FUTURES', 'LEAN_HOGS_FUTURES', 'CLASS_III_MILK_FUTURES', 'CHICKEN_PRICE_INDEX', 'DOMESTIC_FOOD_MONITOR'] },
    { title: 'Tropikal ve Küresel Sepet', description: 'Kahve, şeker, kakao, palm yağı ve geniş küresel gıda sepeti.', symbols: ['JO', 'CANE', 'CC=F', 'PALM_OIL_FUTURES', 'FAO_FOOD_PRICE_INDEX', 'DBA'] },
    { title: 'Arz Kırılganlığı', description: 'Stok, WASDE, gübre, zirai ilaç ve mahsul kondisyonu kaynaklı daralma riski.', symbols: ['STOCKS_TO_USE_RATIO', 'WASDE_REVISION_INDEX', 'USDA_CROP_PROGRESS', 'USDA_CROP_CONDITION', 'FERTILIZER_PRICE_INDEX', 'DAP_FERTILIZER_PRICE', 'AMMONIA_FERTILIZER_PRICE', 'PESTICIDE_AGROCHEM_PRICE_INDEX'] },
    { title: 'İklim ve Verim', description: 'Kuraklık, ENSO ve toprak nemi üzerinden üretim verimliliği baskısı.', symbols: ['US_DROUGHT_MONITOR', 'DROUGHT_SEVERITY_INDEX', 'ENSO_INDEX', 'SOIL_MOISTURE_INDEX'] },
    { title: 'Enerji, Navlun ve Verimlilik', description: 'Tarımın enerji bağımlılığı, ihracat lojistiği ve teknolojik verimlilik dönüşümü.', symbols: ['ENERGY_AGRI_RATIO', 'AGRI_BDI_COMPONENT', 'BLACK_SEA_WHEAT_FOB', 'KROP'] },
  ],
  '30000000-0000-0000-0000-000000000007': [
    { title: 'Petrol ve Gaz Fiyatları', description: 'Ham petrol, benzin, distillate ve gaz fiyat cephesi.', symbols: ['CL=F', 'BZ=F', 'WTI_BRENT_SPREAD', 'NG=F', 'TTF_GAS_FUTURES', 'JKM_LNG_MARKER', 'USO', 'UNG', 'RB=F', 'HO=F'] },
    { title: 'Arz Güvenliği ve Stoklar', description: 'Rezerv, stok ve küresel tampon kapasite üzerinden arz savunması.', symbols: ['WCSSTUS1', 'OPEC_SPARE_CAPACITY', 'US_COMMERCIAL_CRUDE_STOCKS', 'CUSHING_CRUDE_STOCKS', 'DISTILLATE_FUEL_STOCKS', 'GASOLINE_STOCKS', 'OECD_COMMERCIAL_OIL_STOCKS'] },
    { title: 'Üretim ve Saha Aktivitesi', description: 'Kule sayıları, üretim hacmi ve rafineri temposu.', symbols: ['BAKER_HUGHES_OIL_RIG_COUNT', 'BAKER_HUGHES_GAS_RIG_COUNT', 'US_CRUDE_OIL_PRODUCTION', 'REFINERY_UTILIZATION_RATE', 'REFINERY_CRACK_SPREAD'] },
    { title: 'Enerji Enflasyonu', description: 'Enerjinin tüketici fiyatları üzerindeki doğrudan baskısı.', symbols: ['CPIENGSL'] },
    { title: 'Geçiş ve Güç Piyasası', description: 'Nükleer, karbon, elektrik marjları ve batarya girdileri üzerinden yeni enerji rejimi.', symbols: ['URA_ENERGY', 'EUA_CARBON_ALLOWANCES', 'REGIONAL_POWER_PRICES', 'CLEAN_SPARK_SPREAD', 'DARK_SPREAD', 'API2_COAL_FUTURES', 'LITHIUM_CARBONATE_SPOT'] },
  ],
  '30000000-0000-0000-0000-000000000008': [
    { title: 'Majör Pariteler', description: 'Euro, yen ve yuan ekseninde küresel döviz rejiminin omurgası.', symbols: ['EURUSD', 'DEXJPUS', 'DEXCHUS', 'FXY', 'CHFUSD', 'AUDJPY'] },
    { title: 'Dolar Rejimi', description: 'Doların reel, nominal ve ticaret ağırlıklı genel gücü.', symbols: ['DTWEXBGSR', 'RBUSBIS', 'DXY_FX'] },
    { title: 'EM ve Asya Kur Baskısı', description: 'Risk iştahına duyarlı gelişmekte olan ülke ve Asya kur ekseni.', symbols: ['DEXBZUS', 'DEXMXUS', 'DEXKOUS', 'SGDUSD', 'NOKUSD', 'CNH_CNY_SPREAD_FX'] },
    { title: 'Opsiyon ve Volatilite', description: 'İmplied volatilite ve risk reversal üzerinden kur korkusu fiyatlaması.', symbols: ['JPM_VXY_INDEX', 'EURUSD_3M_IV', 'USDJPY_3M_IV', 'USDJPY_RISK_REVERSAL', 'EURUSD_RISK_REVERSAL'] },
    { title: 'Likidite ve Müdahale', description: 'Basis swap, forward eğrisi ve rezerv savunması üzerinden sistemik baskı.', symbols: ['CROSS_CURRENCY_BASIS', 'FX_RESERVE_DEPLETION_VELOCITY', 'FX_FORWARD_POINTS_CURVE', 'CB_INTERVENTION_PROXY', 'REAL_RATE_DIFF_US_G10', 'G10_CARRY_BASKET_RETURN'] },
    { title: 'Alternatif Referanslar', description: 'Altın-gümüş ve Bitcoin gibi alternatif fiyatlama rejimleri.', symbols: ['GOLD_SILVER_RATIO', 'BTCUSD_FX'] },
  ],
  '30000000-0000-0000-0000-000000000009': [
    { title: 'Getiri Eğrisi ve Faiz', description: 'Nominal, reel ve term premium tarafındaki temel faiz rejimi.', symbols: ['DGS10', 'DFII10', 'T10Y3M', 'T10Y2Y_PUBLIC', 'US_30Y_3M_CURVE', 'US_TERM_PREMIUM', 'US_5Y5Y_INFLATION_SWAP', 'US_10Y_NOMINAL_REAL_SPREAD'] },
    { title: 'Bütçe ve Borç Dinamikleri', description: 'Bütçe açığı, borç stoku ve faiz yükünün sürdürülebilirliği.', symbols: ['FYFSGDA188S', 'GFDGDPA188S', 'US_NET_INTEREST_GDP', 'US_NET_INTEREST_REVENUE', 'INTEREST_EXPENSE_TO_TAX_REVENUE', 'AVG_FUNDING_COST_US', 'SOVEREIGN_DURATION_AVG'] },
    { title: 'Hazine Finansmanı', description: 'İhale talebi, borçlanma kompozisyonu ve nakit yönetimi.', symbols: ['TREASURY_BID_TO_COVER', 'TGA_SOVEREIGN', 'BILL_ISSUANCE_SHARE', 'FOREIGN_OFFICIAL_TSY_HOLDINGS', 'FED_TSY_HOLDINGS_SHARE'] },
    { title: 'Volatilite ve CDS', description: 'Tahvil piyasası stresi ve devlet temerrüt primi.', symbols: ['MOVE_SOVEREIGN', 'US_SOVEREIGN_CDS_5Y'] },
    { title: 'Avrupa ve Japonya Çevresi', description: 'Euro bölgesi parçalanma riski ve Japon getiri kontrolü.', symbols: ['BUND_BTP_10Y_SPREAD', 'FR_DE_10Y_SPREAD', 'ES_DE_10Y_SPREAD', 'GR_DE_10Y_SPREAD', 'JGB_YCC_LEVEL'] },
  ],
  '30000000-0000-0000-0000-000000000010': [
    { title: 'Ana EM Beta', description: 'Gelişmekte olan ülke hisse ve dolar tahvili risk iştahı.', symbols: ['EEM', 'EMB', 'JPM_EMBI_GLOBAL_DIVERSIFIED_SPREAD', 'JPM_GBI_EM_GLOBAL_DIVERSIFIED_INDEX', 'EM_LOCAL_CURRENCY_BOND_YIELD_INDEX', 'EM_HIGH_YIELD_CORP_OAS'] },
    { title: 'Bölgesel ETF Haritası', description: 'Çin dışı EM ve seçili ülkeler üzerinden bölgesel kırılganlık haritası.', symbols: ['EMXC', 'FXI', 'EWZ', 'EWW', 'EIDO', 'VNM', 'EPI', 'TUR', 'EWT'] },
    { title: 'Kur ve Sermaye Baskısı', description: 'Kur ayrışması, rezerv tamponu ve sıcak para akışları.', symbols: ['DEXBZUS', 'DEXSFUS', 'CNH_CNY_SPREAD', 'FX_RESERVES_ST_DEBT_RATIO', 'IIF_NET_CAPITAL_FLOWS', 'ADXY_INDEX', 'EM_CDS_SPREAD_5Y'] },
    { title: 'Çin Kredi Motoru', description: 'Çin finansman döngüsünün EM geneline yayılan etkisi.', symbols: ['CHINA_TOTAL_SOCIAL_FINANCING', 'CHINA_CREDIT_IMPULSE'] },
    { title: 'EM Reel Aktivite', description: 'İmalat, ihracat siparişleri ve volatilite üzerinden büyüme nabzı.', symbols: ['EM_MANUFACTURING_PMI_BASKET', 'EM_EXPORT_NEW_ORDERS_INDEX', 'VXEEM_EM'] },
  ],
  '10000000-0000-0000-0000-000000000001': [
    { title: 'Finansal Stres', description: 'Sistemin genel tansiyonu, volatilite ve high-yield spread baskısı.', symbols: ['STLFSI4', 'NFCI', 'BAMLH0A0HYM2', 'MOVE', 'VIXCLS'] },
    { title: 'Getiri Eğrisi ve Kredi', description: 'Resesyon sinyali ve banka kredi iştahı.', symbols: ['T10Y2Y', 'T10Y3M', 'TOTBKCR'] },
    { title: 'Kısa Vadeli Fonlama', description: 'Para piyasası, rezerv tamponu ve fonlama maliyetleri.', symbols: ['SOFR', 'SOFR_IORB', 'IORB', 'WRESBAL'] },
    { title: 'Kurumsal ve Ticari Risk', description: 'Ticari fonlama, küçük işletme kredisi ve kaldıraçlı kredi baskısı.', symbols: ['COMMERCIAL_PAPER_SPREAD', 'NFIB_CREDIT_SURVEY', 'LEVERAGED_LOAN_INDEX'] },
  ],
  '10000000-0000-0000-0000-000000000002': [
    { title: 'Net Likidite', description: 'Piyasaya akan efektif dolar ve ivmesi.', symbols: ['NET_LIQUIDITY', 'NET_LIQUIDITY_ROC', 'WALCL'] },
    { title: 'Hazine ve RRP', description: 'Hazine hesabı, Fed park alanı ve para piyasasına çekilen nakit etkisi.', symbols: ['WTREGEN', 'RRPONTSYD', 'WMFSL_LIQUIDITY'] },
    { title: 'Rezerv, Para ve Eğri', description: 'Banka tamponu, para arzı, dolar sıkılığı ve kredi eğrisinin yönü.', symbols: ['BANK_RESERVES_LIQ', 'M2SL', 'DX-Y.NYB', 'T10Y2Y_LIQUIDITY'] },
  ],
  '10000000-0000-0000-0000-000000000003': [
    { title: 'İşgücü', description: 'İşsizlik, istihdam ve haftalık kırılma sinyalleri.', symbols: ['UNRATE', 'PAYEMS', 'ICSA'] },
    { title: 'Üretim', description: 'Sanayi çevrimi, PMI ve kapasite kullanımı.', symbols: ['INDPRO', 'NAPM', 'TCU'] },
    { title: 'Tüketim ve Gelir', description: 'Tüketici harcaması ve reel gelir gücü.', symbols: ['RRSFS', 'DSPIC96'] },
    { title: 'Küçük İşletme ve Güven', description: 'Küçük işletme güveni, taşımacılık ve konut öncüleri.', symbols: ['NFIB_SMALL_BUSINESS_OPTIMISM', 'CASS_FREIGHT_INDEX', 'TEMP_HELP_SERVICES', 'HOUSING_STARTS_PERMITS'] },
  ],
  '10000000-0000-0000-0000-000000000004': [
    { title: 'Ana Enflasyon', description: 'Başlık, çekirdek ve piyasa bazlı enflasyon beklentisi.', symbols: ['CPIAUCSL', 'PCEPILFE', 'PPIACO', 'T10YIE', 'TRUFLATION_INDEX'] },
    { title: 'Kalıcılık ve Yayılım', description: 'Enflasyonun genele ne kadar yerleştiğini gösterir.', symbols: ['STICKCPIM158SFRBATL', 'STICKCPIXSHLTRM158SFRBATL', 'MEDCPIM158SFRBCLE'] },
    { title: 'Ücret ve Beklentiler', description: 'Ücret-fiyat sarmalı ve hanehalkı algısı.', symbols: ['CES0500000003', 'FRBATLWGTUMHWGO', 'MICH', 'UNIT_LABOR_COSTS', 'ATLANTA_WAGE_SWITCHER_STAYER_GAP'] },
    { title: 'Maliyet ve Barınma', description: 'İthalat, tedarik zinciri, kira ve emtia baskısı.', symbols: ['IR', 'GSCPI', 'ZORI', 'CRB_COMMODITY'] },
  ],
  '10000000-0000-0000-0000-000000000005': [
    { title: 'Jeopolitik ve Belirsizlik', description: 'Savaş, politika belirsizliği ve kuyruk riski fiyatlaması.', symbols: ['GPR_INDEX', 'GEPU_GLOBAL', 'SKEW_BLACK_SWAN', 'CYBER_THREAT_LEVEL'] },
    { title: 'Ticaret ve Tedarik', description: 'Küresel nakliye ve tedarik zinciri tıkanıklıkları.', symbols: ['GSCPI_GLOBAL_RISK', 'BDI_GLOBAL', 'WCI_DREWRY', 'TANKER_FREIGHT_INDEX'] },
    { title: 'Risk Oranları ve Spreadler', description: 'Büyüme-korku dengesi, volatilite ve EM sermaye kaçışı sinyalleri.', symbols: ['COPPER_GOLD_RATIO', 'VXEEM_INDEX', 'JPM_EMBI_GLOBAL_SPREAD', 'RESERVE_DEPLETION_VELOCITY'] },
    { title: 'Yapısal Kırılganlık', description: 'Gıda ve kritik mineral kaynaklı uzun vadeli riskler.', symbols: ['GLOBAL_FOOD_VOLATILITY', 'CRITICAL_MINERAL_SUPPLY_RISK'] },
    { title: 'Teknoloji ve Lojistik Darboğazı', description: 'Yarı iletken stok/satış dengesinden okunan üretim sıkışması.', symbols: ['GLOBAL_SEMI_STOCK_SALES_RATIO'] },
  ],
};

function groupMetrics(categoryId: string, metrics: DashboardData['pilotMetrics']) {
  const groups = CATEGORY_GROUPS[categoryId];

  if (!groups || groups.length === 0) {
    return [{ title: 'Metrikler', description: 'Bu kategori için gruplanmamış aktif metrikler.', metrics }];
  }

  const metricMap = new Map(metrics.map((metric) => [metric.symbol, metric]));
  const used = new Set<string>();

  const grouped = groups
    .map((group) => {
      const items = group.symbols
        .map((symbol) => metricMap.get(symbol))
        .filter((metric): metric is DashboardData['pilotMetrics'][number] => Boolean(metric));

      items.forEach((metric) => used.add(metric.symbol));

      return {
        title: group.title,
        description: group.description,
        metrics: items,
      };
    })
    .filter((group) => group.metrics.length > 0);

  const remaining = metrics.filter((metric) => !used.has(metric.symbol));
  if (remaining.length > 0) {
    grouped.push({ title: 'Diğer Metrikler', description: 'Tanımlı bloklara girmeyen ek metrikler.', metrics: remaining });
  }

  return grouped;
}

function formatNewsTimestamp(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAlertTimestamp(value: string | null) {
  if (!value) return '--';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';

  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatLastUpdateLabel(value: string | null) {
  if (!value) return '--';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';

  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getAiReliability(confidence: number | null, coverage: number) {
  const base = confidence ?? (coverage >= 85 ? 4 : coverage >= 65 ? 3 : coverage >= 40 ? 2 : 1);
  return Math.max(1, Math.min(5, Math.round(base)));
}

function inferAlertCategory(
  message: string,
  categories: DashboardData['categories'],
  placeholders: Array<[string, string]>,
) {
  const normalized = normalizeVisibleText(message).toLowerCase();
  const matches = [...categories.map((item) => item.name), ...placeholders.map(([, label]) => label)];
  const directMatch = matches.find((name) => normalized.includes(name.toLowerCase()));
  if (directMatch) return directMatch;

  const heuristics: Array<{ keywords: string[]; category: string }> = [
    { keywords: ['fed', 'fomc'], category: 'Fed İçi Güç Dengesi' },
    { keywords: ['likidite', 'rrp', 'tga', 'rezerv'], category: 'Piyasa Likiditesi' },
    { keywords: ['kredi', 'spread', 'stres', 'sofr'], category: 'Kredi ve Finansal Stres' },
    { keywords: ['enflasyon', 'tüfe', 'üfe', 'sticky', 'median'], category: 'Enflasyon Baskıları' },
    { keywords: ['petrol', 'enerji', 'gaz'], category: 'Enerji ve Enerji Güvenliği' },
    { keywords: ['etf', 'flow', 'options', 'dark pool'], category: 'ETF ve Sermaye Akışı' },
    { keywords: ['altın', 'gümüş', 'metal'], category: 'Değerli Metaller' },
    { keywords: ['tarım', 'gıda', 'kuraklık', 'fao'], category: 'Tarımsal Emtia ve Gıda Güvenliği' },
    { keywords: ['btc', 'bitcoin', 'crypto', 'kripto'], category: 'Kripto Para Piyasaları' },
  ];

  const heuristicMatch = heuristics.find((item) => item.keywords.some((keyword) => normalized.includes(keyword)));
  return heuristicMatch?.category ?? 'Genel';
}

function getScoreWord(score: number | null) {
  if (score === null) return 'Bekliyor';
  if (score >= 75) return 'Risk-On';
  if (score >= 50) return 'Nötr';
  if (score >= 25) return 'Savunmacı';
  return 'Stresli';
}

function getScoreTone(score: number | null) {
  if (score === null) return { color: '#666666', border: 'border-[#2A2A2A]', bg: 'bg-[#0D0D0D]' };
  if (score >= 75) return { color: '#4ADE80', border: 'border-[#16351F]', bg: 'bg-[#0D120D]' };
  if (score >= 50) return { color: '#FBBF24', border: 'border-[#3C3113]', bg: 'bg-[#120F0A]' };
  if (score >= 25) return { color: '#FB923C', border: 'border-[#402313]', bg: 'bg-[#140E0A]' };
  return { color: '#F87171', border: 'border-[#3F1818]', bg: 'bg-[#140B0B]' };
}

function getGroupIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('risk') || lower.includes('stres') || lower.includes('uyari')) return <ShieldAlert className="w-4 h-4" />;
  if (lower.includes('kurum') || lower.includes('politika') || lower.includes('fed')) return <Landmark className="w-4 h-4" />;
  if (lower.includes('teknoloji') || lower.includes('ai') || lower.includes('hesaplama')) return <Cpu className="w-4 h-4" />;
  if (lower.includes('tarım') || lower.includes('gıda') || lower.includes('tahıl')) return <Wheat className="w-4 h-4" />;
  if (lower.includes('metal') || lower.includes('altın')) return <Gem className="w-4 h-4" />;
  if (lower.includes('akım') || lower.includes('breadth') || lower.includes('genişliği')) return <TrendingUp className="w-4 h-4" />;
  if (lower.includes('likidite') || lower.includes('rezerv') || lower.includes('nakit')) return <Radar className="w-4 h-4" />;
  return <Layers3 className="w-4 h-4" />;
}

function getGroupTone(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('risk') || lower.includes('stres') || lower.includes('uyari')) {
    return {
      border: 'border-[#3F1818]',
      bg: 'bg-[#140B0B]',
      softBg: 'bg-[#1A0F0F]',
      glow: '0 0 0 1px rgba(248,113,113,0.04) inset',
      icon: 'text-[#F87171]',
      accent: '#F87171',
    };
  }
  if (lower.includes('kurum') || lower.includes('politika') || lower.includes('fed')) {
    return {
      border: 'border-[#1A3140]',
      bg: 'bg-[#0B1216]',
      softBg: 'bg-[#0E171C]',
      glow: '0 0 0 1px rgba(125,211,252,0.04) inset',
      icon: 'text-[#7DD3FC]',
      accent: '#7DD3FC',
    };
  }
  if (lower.includes('teknoloji') || lower.includes('ai') || lower.includes('hesaplama')) {
    return {
      border: 'border-[#173325]',
      bg: 'bg-[#0B120F]',
      softBg: 'bg-[#0E1713]',
      glow: '0 0 0 1px rgba(74,222,128,0.04) inset',
      icon: 'text-[#4ADE80]',
      accent: '#4ADE80',
    };
  }
  if (lower.includes('tarım') || lower.includes('gıda') || lower.includes('tahıl')) {
    return {
      border: 'border-[#3B3116]',
      bg: 'bg-[#141108]',
      softBg: 'bg-[#1A150A]',
      glow: '0 0 0 1px rgba(251,191,36,0.04) inset',
      icon: 'text-[#FBBF24]',
      accent: '#FBBF24',
    };
  }
  if (lower.includes('metal') || lower.includes('altın')) {
    return {
      border: 'border-[#4A3415]',
      bg: 'bg-[#161008]',
      softBg: 'bg-[#1D1409]',
      glow: '0 0 0 1px rgba(253,186,116,0.04) inset',
      icon: 'text-[#FDBA74]',
      accent: '#FDBA74',
    };
  }
  if (lower.includes('akım') || lower.includes('breadth') || lower.includes('genişliği')) {
    return {
      border: 'border-[#18313C]',
      bg: 'bg-[#0A1216]',
      softBg: 'bg-[#0D181D]',
      glow: '0 0 0 1px rgba(103,232,249,0.04) inset',
      icon: 'text-[#67E8F9]',
      accent: '#67E8F9',
    };
  }
  if (lower.includes('likidite') || lower.includes('rezerv') || lower.includes('nakit')) {
    return {
      border: 'border-[#1E341C]',
      bg: 'bg-[#0C120B]',
      softBg: 'bg-[#101710]',
      glow: '0 0 0 1px rgba(134,239,172,0.04) inset',
      icon: 'text-[#86EFAC]',
      accent: '#86EFAC',
    };
  }
  return {
    border: 'border-[#2A2A2A]',
    bg: 'bg-[#111111]',
    softBg: 'bg-[#0D0D0D]',
    glow: '0 0 0 1px rgba(163,163,163,0.04) inset',
    icon: 'text-[#A3A3A3]',
    accent: '#A3A3A3',
  };
}

function getScoreNarrative(score: number | null, categoryName: string) {
  if (score === null) {
    return `${categoryName} için henüz yeterli veri yok. Kategori çalıştırıldıkça bu alan daha anlamlı bir rejim okuması sunar.`;
  }

  if (score >= 75) {
    return `${score}/100, bu kategoride koşulların genel olarak destekleyici ve sağlıklı olduğunu gösterir. Stres unsurları var olsa bile ana rejim şu an daha dengeli görünüyor.`;
  }

  if (score >= 50) {
    return `${score}/100, bu kategoride sinyallerin karışık olduğunu gösterir. Ne belirgin bir rahatlama ne de tam bir stres rejimi var; denge kıran detaylar alt metriklerde aranır.`;
  }

  if (score >= 25) {
    return `${score}/100, bu kategoride kırılganlığın arttığını ve savunmacı bir rejime geçildiğini anlatır. Ana tablo bozulmuş değil ama baskı birikiyor.`;
  }

  return `${score}/100, bu kategoride belirgin stres ve bozulma olduğunu gösterir. Alt metrikler genelde aynı yöne bakıyor ve riskler daha toplu hissediliyor.`;
}

function getMetricMeaning(metric: DashboardData['pilotMetrics'][number]) {
  const base = normalizeVisibleText(metric.description?.trim() || `${metric.name}, bu kategorinin genel rejimini okumaya yardım eden bir göstergedir.`);
  const lowText = metric.isInverse
    ? 'Düşük kalması genelde daha dengeli ve daha az baskılı bir zemine işaret eder.'
    : 'Düşük kalması genelde zayıflama, ilginin düşmesi veya destekleyici zeminin zayıf olduğuna işaret eder.';
  const highText = metric.isInverse
    ? 'Yüksek seyretmesi genelde stresin, maliyetin veya kırılganlığın arttığını düşündürür.'
    : 'Yüksek seyretmesi genelde güçlenme, yayılım veya destekleyici rejimin korunduğunu düşündürür.';

  return {
    base,
    lowText,
    highText,
  };
}

function normalizeVisibleText(text: string) {
  return text
    .replace(/\bgenis\b/gi, 'geniş')
    .replace(/\bgenisligini\b/gi, 'genişliğini')
    .replace(/\byogunlasma\b/gi, 'yoğunlaşma')
    .replace(/\byogunlugu\b/gi, 'yoğunluğu')
    .replace(/\byogunlugunu\b/gi, 'yoğunluğunu')
    .replace(/\betkilesimi\b/gi, 'etkileşimi')
    .replace(/\bgostergesi\b/gi, 'göstergesi')
    .replace(/\bgostergesidir\b/gi, 'göstergesidir')
    .replace(/\bgosteren\b/gi, 'gösteren')
    .replace(/\bgosterir\b/gi, 'gösterir')
    .replace(/\bgorunumu\b/gi, 'görünümü')
    .replace(/\bgorunur\b/gi, 'görünür')
    .replace(/\byuksek\b/gi, 'yüksek')
    .replace(/\bdusuk\b/gi, 'düşük')
    .replace(/\bdegeri\b/gi, 'değeri')
    .replace(/\bdegisimi\b/gi, 'değişimi')
    .replace(/\bkirilgan\b/gi, 'kırılgan')
    .replace(/\bkirilganligi\b/gi, 'kırılganlığı')
    .replace(/\buyari\b/gi, 'uyarı')
    .replace(/\bonem\b/gi, 'önem')
    .replace(/\boncu\b/gi, 'öncü')
    .replace(/\bone\b/gi, 'öne')
    .replace(/\bozel\b/gi, 'özel')
    .replace(/\bisaret\b/gi, 'işaret')
    .replace(/\balim\b/gi, 'alım')
    .replace(/\bsirket\b/gi, 'şirket')
    .replace(/\buretim\b/gi, 'üretim')
    .replace(/\buretiminde\b/gi, 'üretiminde')
    .replace(/\bmulkiyet\b/gi, 'mülkiyet')
    .replace(/\bzeka\b/gi, 'zeka')
    .replace(/\bdunya\b/gi, 'dünya')
    .replace(/\bbuyume\b/gi, 'büyüme')
    .replace(/\bbuyumesini\b/gi, 'büyümesini')
    .replace(/\btabanli\b/gi, 'tabanlı')
    .replace(/\bmetrigi\b/gi, 'metriği')
    .replace(/\bacik\b/gi, 'açık')
    .replace(/\bakis\b/gi, 'akış')
    .replace(/\byayilim\b/gi, 'yayılım')
    .replace(/\bivmesi\b/gi, 'ivmesi')
    .replace(/\bhizi\b/gi, 'hızı')
    .replace(/\bhaftalik\b/gi, 'haftalık')
    .replace(/\byillik\b/gi, 'yıllık')
    .replace(/\byapisal\b/gi, 'yapısal')
    .replace(/\bkararlarini\b/gi, 'kararlarını')
    .replace(/\bbarinma\b/gi, 'barınma')
    .replace(/\baltyapi\b/gi, 'altyapı')
    .replace(/\btemasini\b/gi, 'temasını')
    .replace(/\bpiyasa bazli\b/gi, 'piyasa bazlı')
    .replace(/\bteknoloji yogunlasma\b/gi, 'teknoloji yoğunlaşma')
    .replace(/\bsagligini\b/gi, 'sağlığını')
    .replace(/\bdegisim\b/gi, 'değişim')
    .replace(/\bguncel\b/gi, 'güncel')
    .replace(/\bagirlikli\b/gi, 'ağırlıklı')
    .replace(/\bstoklari\b/gi, 'stokları')
    .replace(/\bgorus\b/gi, 'görüş')
    .replace(/\bguclenme\b/gi, 'güçlenme')
    .replace(/\bkorundugunu\b/gi, 'korunduğunu')
    .replace(/\baktif dolasan\b/gi, 'aktif dolaşan')
    .replace(/\baktif dolasan\b/gi, 'aktif dolaşan')
    .replace(/\bkişilerin\b/gi, 'kişilerin')
    .replace(/\bkisilerin\b/gi, 'kişilerin')
    .replace(/\bveri merkezi\b/gi, 'veri merkezi')
    .replace(/\byesil\b/gi, 'yeşil')
    .replace(/\bfiziksel dunya\b/gi, 'fiziksel dünya')
    .replace(/\bAr-Ge\b/g, 'Ar-Ge');
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
) {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) return;
      await worker(item);
    }
  });

  await Promise.all(runners);
}

export default function App() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(() => {
    if (typeof window === 'undefined') return 'home';
    const hash = window.location.hash.replace(/^#/, '').trim();
    return hash || 'home';
  });
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [alertSeverityFilter, setAlertSeverityFilter] = useState<'all' | 'red' | 'yellow'>('all');
  const [alertCategoryFilter, setAlertCategoryFilter] = useState<string>('all');
  const { data, loading, refetch } = useDashboardData(selectedCategoryId);
  const visiblePlaceholders = Object.entries(PLACEHOLDERS).filter(
    ([id]) => !data?.categories.some((category) => category.id === id),
  );
  const selectedCategory = data?.categories.find((category) => category.id === selectedCategoryId) || null;
  const topPanelLabel = selectedCategoryId === 'home'
    ? 'Mergen Index'
    : selectedCategoryId === NEWS_SECTION_ID
      ? 'Haberler'
      : selectedCategoryId === ALERTS_SECTION_ID
        ? 'Uyarılar'
        : selectedCategoryId === DIVERGENCES_SECTION_ID
          ? 'Sapmalar'
          : selectedCategoryId === SETTINGS_SECTION_ID
            ? 'Ayarlar'
            : selectedCategoryId === COOLDOWN_SECTION_ID
              ? 'Cooldown'
      : selectedCategory?.name || PLACEHOLDERS[selectedCategoryId] || 'Kategori Endeksi';
  const topPanelScore = selectedCategoryId === 'home'
    ? data?.totalScore ?? null
    : selectedCategoryId === NEWS_SECTION_ID
      || selectedCategoryId === ALERTS_SECTION_ID
      || selectedCategoryId === DIVERGENCES_SECTION_ID
      || selectedCategoryId === SETTINGS_SECTION_ID
      || selectedCategoryId === COOLDOWN_SECTION_ID
      ? null
      : selectedCategory?.score ?? null;
  const topPanelTrend = selectedCategoryId === 'home'
    ? data?.totalScoreTrend ?? 'flat'
    : selectedCategoryId === NEWS_SECTION_ID
      || selectedCategoryId === ALERTS_SECTION_ID
      || selectedCategoryId === DIVERGENCES_SECTION_ID
      || selectedCategoryId === SETTINGS_SECTION_ID
      || selectedCategoryId === COOLDOWN_SECTION_ID
      ? 'flat'
      : selectedCategory?.trend ?? 'flat';
  const topPanelChange7d = selectedCategoryId === 'home'
    ? data?.totalScoreChange7d ?? null
    : selectedCategoryId === NEWS_SECTION_ID
      || selectedCategoryId === ALERTS_SECTION_ID
      || selectedCategoryId === DIVERGENCES_SECTION_ID
      || selectedCategoryId === SETTINGS_SECTION_ID
      || selectedCategoryId === COOLDOWN_SECTION_ID
      ? null
      : selectedCategory?.change7d ?? null;
  const topInfoTitle = selectedCategoryId === 'home'
    ? `Sistem Notu (${data?.alerts.length ?? 0} Aktif Uyarı)`
    : selectedCategoryId === NEWS_SECTION_ID
      ? 'Haber Notu'
      : selectedCategoryId === ALERTS_SECTION_ID
        ? 'Uyarı Merkezi'
        : selectedCategoryId === DIVERGENCES_SECTION_ID
          ? 'Sapma Notu'
          : selectedCategoryId === SETTINGS_SECTION_ID
            ? 'Panel Ayarları'
            : selectedCategoryId === COOLDOWN_SECTION_ID
              ? 'Operasyon Merkezi'
      : 'Skor Okumasi';
  const topInfoText = selectedCategoryId === 'home'
    ? (data?.alerts.length ?? 0) > 0
      ? `Sistemde şu anda ${data?.alerts.length ?? 0} aktif uyarı var. Ana rejimi okurken aşağıdaki uyarı ve sapma bloklarıyla birlikte değerlendirmek en doğru sonucu verir.`
      : 'Sistemde aktif uyarı yok. Genel tabloyu yine de kategori skorlarının dağılımı ve son sapmalarla birlikte okumak gerekir.'
    : selectedCategoryId === NEWS_SECTION_ID
      ? 'Bu alan haber akışının genel önem seviyesini ve günlük yoğunluğunu izlemek için kullanılır.'
      : selectedCategoryId === ALERTS_SECTION_ID
        ? 'Bu ekran, sistemde tetiklenen uyarıları kategori ve önem seviyesine göre filtreleyip hızlıca taramak için hazırlandı.'
        : selectedCategoryId === DIVERGENCES_SECTION_ID
          ? 'Burada ana skor ile alt metriklerin ters düştüğü dikkat çekici ayrışmalar izlenir.'
          : selectedCategoryId === SETTINGS_SECTION_ID
            ? 'Ayarlar bölümü görünüm, hareket ve rehber deneyimini kişiselleştirmek için ilk yapı taşlarını içerir.'
            : selectedCategoryId === COOLDOWN_SECTION_ID
              ? 'Bu gizli ekran, sistem çalıştırma ve AI yorum yenileme işlemlerini tek yerden manuel tetiklemek için hazırlandı.'
      : getScoreNarrative(topPanelScore, topPanelLabel);
  const scoredCategories = (data?.categories ?? []).filter(
    (category) => category.score !== null && category.score !== undefined,
  );
  const strongestCategory = scoredCategories.length > 0
    ? [...scoredCategories].sort((a, b) => Number(b.score) - Number(a.score))[0]
    : null;
  const weakestCategory = scoredCategories.length > 0
    ? [...scoredCategories].sort((a, b) => Number(a.score) - Number(b.score))[0]
    : null;
  const totalFetchedMetrics = (data?.categories ?? []).reduce((sum, category) => sum + category.fetchedCount, 0);
  const totalTrackedMetrics = (data?.categories ?? []).reduce((sum, category) => sum + category.totalCount, 0);
  const coverageRatio = totalTrackedMetrics > 0
    ? Math.round((totalFetchedMetrics / totalTrackedMetrics) * 100)
    : 0;
  const selectedCategoryMetrics = data?.pilotMetrics ?? [];
  const selectedFetchedMetrics = selectedCategoryMetrics.filter((metric) => metric.value !== null).length;
  const selectedCoverageRatio = selectedCategoryMetrics.length > 0
    ? Math.round((selectedFetchedMetrics / selectedCategoryMetrics.length) * 100)
    : 0;
  const selectedLastUpdate = selectedCategoryMetrics
    .map((metric) => metric.latestDate)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
  const selectedAiReliability = getAiReliability(data?.aiConfidence ?? null, selectedCoverageRatio);
  const isUtilityPage = UTILITY_SECTION_IDS.includes(selectedCategoryId as typeof UTILITY_SECTION_IDS[number]);
  const isCategoryPage = !isUtilityPage && selectedCategoryId !== 'home';
  const isCategoryTransitioning = loading && isCategoryPage;
  const alertsWithCategory = (data?.alerts ?? []).map((alert) => ({
    ...alert,
    category: inferAlertCategory(alert.message, data?.categories ?? [], visiblePlaceholders),
  }));
  const alertCategoryOptions = Array.from(new Set(alertsWithCategory.map((alert) => alert.category as string)))
    .sort((a: string, b: string) => a.localeCompare(b, 'tr'));
  const filteredAlerts = alertsWithCategory.filter((alert) => {
    const severityMatch = alertSeverityFilter === 'all'
      || (alertSeverityFilter === 'red' ? alert.type === 'red' : alert.type === 'yellow');
    const categoryMatch = alertCategoryFilter === 'all' || alert.category === alertCategoryFilter;
    return severityMatch && categoryMatch;
  });

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(APP_SETTINGS_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<AppSettings>;
      setSettings({
        theme: parsed.theme === 'graphite' || parsed.theme === 'light' ? parsed.theme : 'dark',
        reducedMotion: Boolean(parsed.reducedMotion),
        guideDefaultOpen: Boolean(parsed.guideDefaultOpen),
        showMetricDates: parsed.showMetricDates !== false,
        compactText: Boolean(parsed.compactText),
        showLegalNote: parsed.showLegalNote !== false,
      });
    } catch {
      setSettings(DEFAULT_SETTINGS);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.motion = settings.reducedMotion ? 'reduced' : 'full';
    document.documentElement.dataset.density = settings.compactText ? 'compact' : 'comfortable';
  }, [settings]);

  useEffect(() => {
    setIsGuideOpen(settings.guideDefaultOpen);
  }, [selectedCategoryId, settings.guideDefaultOpen]);

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.replace(/^#/, '').trim();
      if (!hash) {
        setSelectedCategoryId('home');
        return;
      }

      const knownIds = new Set([
        'home',
        COOLDOWN_SECTION_ID,
        ...UTILITY_SECTION_IDS,
        ...Object.keys(PLACEHOLDERS),
        ...(data?.categories ?? []).map((category) => category.id),
      ]);

      if (knownIds.has(hash)) {
        setSelectedCategoryId(hash);
      }
    };

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [data?.categories]);

  useEffect(() => {
    const nextHash = selectedCategoryId === 'home' ? '' : `#${selectedCategoryId}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    const selectedName = selectedCategoryId === 'home'
      ? 'Mergen Intelligence - Dashboard'
      : selectedCategoryId === NEWS_SECTION_ID
        ? 'Haberler'
        : selectedCategoryId === ALERTS_SECTION_ID
          ? 'Uyarılar'
          : selectedCategoryId === DIVERGENCES_SECTION_ID
            ? 'Sapmalar'
            : selectedCategoryId === SETTINGS_SECTION_ID
              ? 'Ayarlar'
              : selectedCategoryId === COOLDOWN_SECTION_ID
                ? 'Cooldown'
              : selectedCategory?.name || PLACEHOLDERS[selectedCategoryId] || 'Mergen Intelligence';

    document.title = selectedName;
  }, [selectedCategoryId, selectedCategory]);

  const handleSync = async (targetCategoryId = selectedCategoryId) => {
    setIsSyncing(true);
    try {
      const targetIsUtility = UTILITY_SECTION_IDS.includes(targetCategoryId as typeof UTILITY_SECTION_IDS[number]);
      if (targetIsUtility) {
        throw new Error('Bu ekran için sistem çalıştırma gerekmez.');
      }

      const metricsQuery = supabase
        .from('metrics')
        .select('*');

      const { data: metrics, error } = targetCategoryId === 'home'
        ? await metricsQuery
        : await metricsQuery.eq('category_id', targetCategoryId);

      if (error || !metrics || metrics.length === 0) {
        throw new Error(
          targetCategoryId === 'home'
            ? 'No metrics found in database. Please run schema.sql in Supabase.'
            : 'Bu kategori icin metric bulunamadi.',
        );
      }

      console.log(
        targetCategoryId === 'home'
          ? `Found ${metrics.length} metrics to fetch.`
          : `Found ${metrics.length} metrics to fetch for category ${targetCategoryId}.`,
      );

      await runWithConcurrency(metrics, SYNC_CONCURRENCY, async (metric) => {
        console.log(`Fetching ${metric.name} (${metric.symbol})...`);
        try {
          const result = await syncMetric(metric);
          console.log(result.message);
        } catch (e: any) {
          console.error(`Failed: ${metric.name} - ${e.message}`);
        }
      });

      console.log('Running Scoring Engine...');
      await runScoringEngine(targetCategoryId === 'home' ? undefined : targetCategoryId);

      console.log('Running Alert Engine...');
      await runAlertEngine();
      
      // Veriler güncellendikten sonra arayüzü yenile
      await refetch();

      alert(
        targetCategoryId === 'home'
          ? 'Tum sistem icin senkronizasyon, skorlama ve alert hesaplamasi tamamlandi.'
          : 'Bu kategori icin senkronizasyon, skorlama ve alert hesaplamasi tamamlandi.',
      );
    } catch (e: any) {
      console.error(e);
      alert(`Bir hata oluştu: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGenerateAi = async (targetCategoryId = selectedCategoryId) => {
    setIsGeneratingAi(true);
    try {
      const targetIsUtility = UTILITY_SECTION_IDS.includes(targetCategoryId as typeof UTILITY_SECTION_IDS[number]);
      if (targetIsUtility) {
        throw new Error('Bu ekran için AI yorum üretimi tanımlı değil.');
      }

      if (targetCategoryId === 'home') {
        await generateMarketOverview();
      } else {
        await generateCategoryInsight(targetCategoryId);
      }

      await refetch();
      alert(
        targetCategoryId === 'home'
          ? 'Genel piyasa AI yorumu guncellendi.'
          : 'Bu kategori icin AI yorumu guncellendi.',
      );
    } catch (e: any) {
      console.error(e);
      alert(`AI yorumu olusturulamadi: ${e.message}`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  if (loading && !data) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full text-[#666666] font-mono text-sm">
          Sistem başlatılıyor...
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      lastUpdate={data?.lastUpdate}
      categories={data?.categories}
      alertCount={data?.alerts.length ?? 0}
      selectedCategoryId={selectedCategoryId}
      onSelectCategory={setSelectedCategoryId}
    >
      <div className="space-y-6">
        {/* Top Row: General Score + Categories */}
        <div className="flex items-start gap-8">
          {!UTILITY_SECTION_IDS.includes(selectedCategoryId as typeof UTILITY_SECTION_IDS[number]) && (
            <div className="shrink-0">
            <div className="text-[11px] text-[#A3A3A3] uppercase tracking-wider mb-1">{topPanelLabel}</div>
              <div className="flex items-baseline gap-2">
                <div className="text-5xl font-mono tabular-nums leading-none">
                  {topPanelScore !== null ? topPanelScore : '--'}
                </div>
              <div className="text-sm text-[#666666] font-mono">/100</div>
            </div>
              <div className="flex items-center gap-3 mt-2 text-xs font-mono">
                <span className="text-[#666666]">7G değişim</span>
                {topPanelChange7d !== null ? (
                  <span
                    className={`flex items-center ${
                      topPanelTrend === 'up'
                        ? 'text-[#4ADE80]'
                        : topPanelTrend === 'down'
                          ? 'text-[#F87171]'
                          : 'text-[#666666]'
                    }`}
                  >
                    {topPanelTrend === 'up' && <ArrowUp className="w-3 h-3 mr-1" />}
                    {topPanelTrend === 'down' && <ArrowDown className="w-3 h-3 mr-1" />}
                    {topPanelTrend === 'flat' && <Minus className="w-3 h-3 mr-1" />}
                    {Math.abs(topPanelChange7d).toFixed(1)}
                  </span>
                ) : (
                  <span className="text-[#666666] flex items-center">
                    <Minus className="w-3 h-3 mr-1" /> veri yok
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-1 mb-2">
              <div className="text-[11px] text-[#A3A3A3] uppercase tracking-wider">
                {topInfoTitle}
              </div>
            </div>
            <div className="text-sm text-[#A3A3A3] leading-relaxed max-w-3xl">
              {topInfoText}
            </div>
          </div>
        </div>

        {selectedCategoryId === 'home' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr_1fr] gap-4">
              <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Radar className="w-4 h-4 text-[#A3A3A3]" />
                  <div className="text-[11px] text-[#A3A3A3] uppercase tracking-wider">Piyasa Rejim Özeti</div>
                </div>
                <div className="text-2xl font-mono text-[#E5E5E5] tabular-nums">
                  {data?.totalScore ?? '--'}<span className="text-sm text-[#666666] ml-1">/100</span>
                </div>
                <div className="mt-2 text-sm text-[#A3A3A3] leading-relaxed">
                  Genel skor; kredi, likidite, büyüme, enflasyon ve yapısal kategorilerin ortak rejimini tek çizgide özetler.
                </div>
                <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-wider">
                  <span
                    className="rounded-sm px-2 py-1 font-medium"
                    style={{ color: getScoreTone(data?.totalScore ?? null).color, border: `1px solid ${getScoreTone(data?.totalScore ?? null).color}33` }}
                  >
                    {getScoreWord(data?.totalScore ?? null)}
                  </span>
                  <span className="text-[#666666]">7G {topPanelChange7d !== null ? `${topPanelChange7d > 0 ? '+' : ''}${topPanelChange7d.toFixed(1)}` : 'veri yok'}</span>
                </div>
              </div>

              <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-[#4ADE80]" />
                  <div className="text-[11px] text-[#A3A3A3] uppercase tracking-wider">En Güçlü Alan</div>
                </div>
                <div className="text-sm font-medium text-[#E5E5E5] leading-snug">
                  {strongestCategory?.name ?? 'Henuz hesaplanmadi'}
                </div>
                <div className="mt-2 text-2xl font-mono tabular-nums text-[#4ADE80]">
                  {strongestCategory?.score ?? '--'}
                </div>
                <div className="mt-2 text-xs text-[#666666] leading-relaxed">
                  Sistem icinde su an en destekleyici rejimi veren kategori.
                </div>
              </div>

              <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert className="w-4 h-4 text-[#F87171]" />
                  <div className="text-[11px] text-[#A3A3A3] uppercase tracking-wider">En Kırılgan Alan</div>
                </div>
                <div className="text-sm font-medium text-[#E5E5E5] leading-snug">
                  {weakestCategory?.name ?? 'Henuz hesaplanmadi'}
                </div>
                <div className="mt-2 text-2xl font-mono tabular-nums text-[#F87171]">
                  {weakestCategory?.score ?? '--'}
                </div>
                <div className="mt-2 text-xs text-[#666666] leading-relaxed">
                  Baskının en belirgin biriktiği ve dikkat isteyen kategori.
                </div>
              </div>
            </div>

            {/* Alerts & Divergences Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data?.homeInsight && (
                <div className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4 lg:col-span-2">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#4ADE80] animate-pulse mt-1.5 shrink-0"></div>
                    <div className="text-sm md:text-base font-semibold text-[#E5E5E5] tracking-wide leading-snug">
                      Piyasalar Genel Yorum
                    </div>
                    {data?.homeConfidence !== null && data?.homeConfidence !== undefined && (
                      <ConfidenceBadge confidence={data.homeConfidence} />
                    )}
                  </div>
                  <div className="text-sm text-[#E5E5E5] leading-relaxed">
                    {data.homeInsight}
                  </div>
                  {data.homeSimpleSummary && (
                    <div className="mt-4 pt-4 border-t border-[#1F1F1F]">
                      <div className="text-[10px] text-[#A3A3A3] uppercase tracking-wider mb-2">
                        Sade Özet
                      </div>
                      <div className="text-sm text-[#D4D4D4] leading-relaxed">
                        {data.homeSimpleSummary}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Alerts */}
              <div className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4">
                <div className="flex items-center gap-2 mb-4 border-b border-[#1F1F1F] pb-2">
                  <AlertTriangle className="w-4 h-4 text-[#FBBF24]" />
                  <span className="text-sm font-medium uppercase tracking-wider text-[#A3A3A3]">Aktif Uyarılar</span>
                </div>
                {data?.alerts && data.alerts.length > 0 ? (
                  <ul className="space-y-3">
                    {data.alerts.map(alert => (
                      <li key={alert.id} className="flex items-start gap-3">
                        <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${alert.type === 'red' ? 'bg-[#F87171]' : 'bg-[#FBBF24]'}`}></div>
                        <span className="text-sm text-[#E5E5E5]">{alert.message}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-[#666666] font-mono">Sistem normal parametrelerde çalışıyor. Aktif uyarı yok.</div>
                )}
              </div>

              {/* Divergences */}
              <div className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4">
                <div className="flex items-center gap-2 mb-4 border-b border-[#1F1F1F] pb-2">
                  <Activity className="w-4 h-4 text-[#A3A3A3]" />
                  <span className="text-sm font-medium uppercase tracking-wider text-[#A3A3A3]">Son Sapmalar (Divergences)</span>
                </div>
                {data?.divergences && data.divergences.length > 0 ? (
                  <ul className="space-y-3">
                    {data.divergences.map((item) => (
                      <li key={item.id} className="rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] p-3">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.severity === 'high' ? 'bg-[#F87171]' : 'bg-[#FBBF24]'}`}></div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-[#E5E5E5]">{item.title}</span>
                              <span className="text-[10px] uppercase tracking-wider text-[#666666]">{item.category}</span>
                            </div>
                            <div className="mt-1 text-sm text-[#A3A3A3] leading-relaxed">
                              {item.summary}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-[#666666] font-mono">
                    Şu an belirgin bir sapma sinyali tespit edilmedi.
                  </div>
                )}
              </div>
            </div>

            {/* Categories Grid */}
            <div>
              <div className="text-sm font-medium uppercase tracking-wider text-[#A3A3A3] mb-4">Kategori Durumları</div>
              <div className="mb-4 rounded-sm border border-[#1F1F1F] bg-[#111111] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-[#A3A3A3]" />
                  <div className="text-[11px] text-[#A3A3A3] uppercase tracking-wider">Rejim Bandı</div>
                </div>
                <div className="grid grid-cols-4 overflow-hidden rounded-sm border border-[#1F1F1F]">
                  {[
                    { label: 'Risk-On', range: '75-100', color: 'bg-[#102014] text-[#4ADE80]' },
                    { label: 'Nötr', range: '50-74', color: 'bg-[#1A160B] text-[#FBBF24]' },
                    { label: 'Savunmacı', range: '25-49', color: 'bg-[#1D130B] text-[#FB923C]' },
                    { label: 'Stresli', range: '0-24', color: 'bg-[#1B0E0E] text-[#F87171]' },
                  ].map((band) => (
                    <div key={band.label} className={`px-3 py-3 text-center border-r last:border-r-0 border-[#1F1F1F] ${band.color}`}>
                      <div className="text-[10px] uppercase tracking-wider font-medium">{band.label}</div>
                      <div className="text-[10px] opacity-70 mt-1 font-mono">{band.range}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-[#666666] leading-relaxed">
                  Skorlar bu banda göre okunur: yüksek skor daha destekleyici rejimi, düşük skor ise daha baskılı ve kırılgan zemini anlatır.
                </div>
                <div className="mt-4 flex items-center justify-between rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] px-3 py-2 text-[10px] uppercase tracking-wider text-[#666666]">
                  <span>Veri kapsaması</span>
                  <span className="font-mono text-[#A3A3A3]">{totalFetchedMetrics}/{totalTrackedMetrics} metrik • %{coverageRatio}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {data?.categories.map(cat => (
                  <ScoreCircle 
                    key={cat.id} 
                    name={cat.name} 
                    score={cat.score} 
                    trend={cat.trend} 
                    onClick={() => setSelectedCategoryId(cat.id)} 
                  />
                ))}
                {visiblePlaceholders.map(([id, name]) => (
                  <ScoreCircle 
                    key={id} 
                    name={name} 
                    score={null} 
                    trend="flat" 
                    onClick={() => setSelectedCategoryId(id)} 
                  />
                ))}
              </div>
              <div className="mt-4 bg-[#111111] border border-[#1F1F1F] rounded-sm p-4">
                <div className="text-[11px] text-[#A3A3A3] uppercase tracking-wider mb-3">
                  Durum Rehberi
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <div className="border border-[#1F1F1F] rounded-sm bg-[#0D0D0D] p-3">
                    <div className="text-[#4ADE80] font-medium uppercase tracking-wider text-[11px] mb-1">Risk-On</div>
                    <div className="text-[#A3A3A3]">Momentum güçlü, risk iştahı yaygın ve koşullar destekleyici.</div>
                  </div>
                  <div className="border border-[#1F1F1F] rounded-sm bg-[#0D0D0D] p-3">
                    <div className="text-[#FBBF24] font-medium uppercase tracking-wider text-[11px] mb-1">Nötr</div>
                    <div className="text-[#A3A3A3]">Karışık sinyaller var; yön net değil, denge korunuyor.</div>
                  </div>
                  <div className="border border-[#1F1F1F] rounded-sm bg-[#0D0D0D] p-3">
                    <div className="text-[#FB923C] font-medium uppercase tracking-wider text-[11px] mb-1">Savunmacı</div>
                    <div className="text-[#A3A3A3]">Kırılganlık artıyor; piyasa daha seçici ve temkinli davranıyor.</div>
                  </div>
                  <div className="border border-[#1F1F1F] rounded-sm bg-[#0D0D0D] p-3">
                    <div className="text-[#F87171] font-medium uppercase tracking-wider text-[11px] mb-1">Stresli</div>
                    <div className="text-[#A3A3A3]">Baskı yüksek; finansal veya makro stres öne çıkıyor.</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : selectedCategoryId === NEWS_SECTION_ID ? (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4">
                <div className="flex items-center gap-2 mb-4 border-b border-[#1F1F1F] pb-2">
                  <AlertTriangle className="w-4 h-4 text-[#F87171]" />
                  <span className="text-sm font-medium uppercase tracking-wider text-[#A3A3A3]">Kritik Haberler</span>
                </div>
                {data?.news.critical && data.news.critical.length > 0 ? (
                  <ul className="space-y-3">
                    {data.news.critical.map((item) => (
                      <li key={item.id} className="rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] p-3">
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="block hover:bg-[#101010] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-sm font-medium text-[#F5F5F5] leading-relaxed">
                              {item.title}
                            </div>
                            {formatNewsTimestamp(item.publishedAt) && (
                              <div className="shrink-0 text-[10px] font-mono text-[#666666] tabular-nums">
                                {formatNewsTimestamp(item.publishedAt)}
                              </div>
                            )}
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-[#666666] font-mono">
                    Henüz kritik haber eklenmedi.
                  </div>
                )}
              </div>

              <div className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4">
                <div className="flex items-center gap-2 mb-4 border-b border-[#1F1F1F] pb-2">
                  <Home className="w-4 h-4 text-[#A3A3A3]" />
                  <span className="text-sm font-medium uppercase tracking-wider text-[#A3A3A3]">Günlük Güncel Haberler</span>
                </div>
                {data?.news.daily && data.news.daily.length > 0 ? (
                  <ul className="space-y-3">
                    {data.news.daily.map((item) => (
                      <li key={item.id} className="rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] p-3">
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="block hover:bg-[#101010] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-sm text-[#E5E5E5] leading-relaxed">
                              {item.title}
                            </div>
                            {formatNewsTimestamp(item.publishedAt) && (
                              <div className="shrink-0 text-[10px] font-mono text-[#666666] tabular-nums">
                                {formatNewsTimestamp(item.publishedAt)}
                              </div>
                            )}
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-[#666666] font-mono">
                    Henüz günlük haber eklenmedi.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 bg-[#111111] border border-[#1F1F1F] rounded-sm p-4">
              <div className="flex items-center gap-2 mb-4 border-b border-[#1F1F1F] pb-2">
                <Activity className="w-4 h-4 text-[#A3A3A3]" />
                <span className="text-sm font-medium uppercase tracking-wider text-[#A3A3A3]">Ekonomi ile İlgili Diğer Haberler</span>
              </div>
              {data?.news.other && data.news.other.length > 0 ? (
                <ul className="space-y-3">
                  {data.news.other.map((item) => (
                    <li key={item.id} className="rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] p-3">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="block hover:bg-[#101010] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-sm text-[#E5E5E5] leading-relaxed">
                            {item.title}
                          </div>
                          {formatNewsTimestamp(item.publishedAt) && (
                            <div className="shrink-0 text-[10px] font-mono text-[#666666] tabular-nums">
                              {formatNewsTimestamp(item.publishedAt)}
                            </div>
                          )}
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-[#666666] font-mono">
                  Henüz ek ekonomi haberi bulunamadı.
                </div>
              )}
            </div>
          </div>
        ) : selectedCategoryId === ALERTS_SECTION_ID ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr_1fr] gap-4">
              <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-[#FBBF24]" />
                  <div className="text-[11px] text-[#A3A3A3] uppercase tracking-wider">Uyarı Özeti</div>
                </div>
                <div className="text-2xl font-mono text-[#E5E5E5] tabular-nums">
                  {data?.alerts.length ?? 0}<span className="text-sm text-[#666666] ml-1">aktif</span>
                </div>
                <div className="mt-2 text-sm text-[#A3A3A3] leading-relaxed">
                  Kırmızı uyarılar yüksek öncelikli, sarı uyarılar ise takip edilmesi gereken ama daha düşük yoğunluklu sinyalleri temsil eder.
                </div>
              </div>
              <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] p-4">
                <div className="text-[11px] text-[#A3A3A3] uppercase tracking-wider mb-3">Önem Seviyesi</div>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: 'Tümü', value: 'all' as const },
                    { label: 'Kırmızı', value: 'red' as const },
                    { label: 'Sarı', value: 'yellow' as const },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setAlertSeverityFilter(option.value)}
                      className={`rounded-sm border px-3 py-2 text-xs uppercase tracking-wider transition-colors ${
                        alertSeverityFilter === option.value
                          ? 'border-[#2D2D2D] bg-[#0D0D0D] text-[#E5E5E5]'
                          : 'border-[#1F1F1F] bg-[#111111] text-[#666666] hover:text-[#A3A3A3]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] p-4">
                <div className="text-[11px] text-[#A3A3A3] uppercase tracking-wider mb-3">Kategori Filtresi</div>
                <select
                  value={alertCategoryFilter}
                  onChange={(event) => setAlertCategoryFilter(event.target.value)}
                  className="w-full rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] px-3 py-2 text-sm text-[#E5E5E5] outline-none"
                >
                  <option value="all">Tüm kategoriler</option>
                  {alertCategoryOptions.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <div key={alert.id} className="rounded-sm border border-[#1F1F1F] bg-[#111111] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${alert.type === 'red' ? 'bg-[#F87171]' : 'bg-[#FBBF24]'}`}></span>
                          <span className="text-sm font-medium text-[#E5E5E5]">{normalizeVisibleText(alert.message)}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-[#666666]">
                          <span className="rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] px-2 py-1">{alert.category}</span>
                          <span className={`rounded-sm border px-2 py-1 ${alert.type === 'red' ? 'border-[#3F1818] bg-[#140B0B] text-[#F87171]' : 'border-[#3C3113] bg-[#120F0A] text-[#FBBF24]'}`}>
                            {alert.type === 'red' ? 'Kırmızı' : 'Sarı'}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] font-mono text-[#666666] tabular-nums shrink-0">
                        {formatAlertTimestamp(alert.created_at)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-sm border border-dashed border-[#1F1F1F] px-4 py-10 text-center text-sm text-[#666666] font-mono">
                  Bu filtrelerde gösterilecek aktif uyarı bulunmuyor.
                </div>
              )}
            </div>
          </div>
        ) : selectedCategoryId === DIVERGENCES_SECTION_ID ? (
          <div className="space-y-4">
            <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] p-4 text-sm text-[#A3A3A3] leading-relaxed">
              Burada skor ile alt metriklerin ters düştüğü durumlar listelenir. Bu alan, ana tabloyu tek başına değil; alttaki çatlaklarla birlikte okumana yardım eder.
            </div>
            {data?.divergences && data.divergences.length > 0 ? (
              data.divergences.map((item) => (
                <div key={item.id} className="rounded-sm border border-[#1F1F1F] bg-[#111111] p-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.severity === 'high' ? 'bg-[#F87171]' : 'bg-[#FBBF24]'}`}></div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-[#E5E5E5]">{item.title}</span>
                        <span className="rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] px-2 py-1 text-[10px] uppercase tracking-wider text-[#666666]">{item.category}</span>
                      </div>
                      <div className="mt-2 text-sm text-[#A3A3A3] leading-relaxed">{item.summary}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-sm border border-dashed border-[#1F1F1F] px-4 py-10 text-center text-sm text-[#666666] font-mono">
                Şu an belirgin bir sapma sinyali tespit edilmedi.
              </div>
            )}
          </div>
        ) : selectedCategoryId === COOLDOWN_SECTION_ID ? (
          <div className="space-y-6">
            <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] p-4">
              <div className="text-sm font-medium text-[#E5E5E5] mb-2">Gizli Operasyon Ekranı</div>
              <div className="text-sm text-[#A3A3A3] leading-relaxed">
                Bu alan, demo sırasında manuel veri yenileme ve AI yorum tetikleme işlemlerini tek yerden yapmak için ayrıldı.
                Normal kullanıcı menüsünde görünmez; doğrudan <span className="font-mono text-[#D4D4D4]">#cooldown</span> ile açılır.
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'home', name: 'HOME' },
                ...(data?.categories ?? []).map((category) => ({ id: category.id, name: category.name })),
              ].map((entry) => (
                <div key={entry.id} className="rounded-sm border border-[#1F1F1F] bg-[#111111] p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-[#666666] mb-1">
                        {entry.id === 'home' ? 'Genel Sistem' : 'Kategori'}
                      </div>
                      <div className="text-sm text-[#E5E5E5]">{entry.name}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleGenerateAi(entry.id)}
                        disabled={isGeneratingAi || isSyncing}
                        className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-3 py-2 border border-[#1F1F1F] text-[#A3A3A3] hover:text-[#E5E5E5] hover:bg-[#141414] transition-colors disabled:opacity-50"
                      >
                        <Activity className={`w-3 h-3 ${isGeneratingAi ? 'animate-pulse' : ''}`} />
                        {isGeneratingAi ? 'AI...' : 'AI Prompt'}
                      </button>
                      <button
                        onClick={() => handleSync(entry.id)}
                        disabled={isSyncing || isGeneratingAi}
                        className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-3 py-2 border border-[#1F1F1F] text-[#A3A3A3] hover:text-[#E5E5E5] hover:bg-[#141414] transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'İşleniyor...' : (entry.id === 'home' ? 'Sistemi Çalıştır' : 'Kategoriyi Çalıştır')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : selectedCategoryId === SETTINGS_SECTION_ID ? (
          <div className="space-y-6">
            <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] p-4">
              <div className="text-sm font-medium text-[#E5E5E5] mb-2">Ayar Merkezi</div>
              <div className="text-sm text-[#A3A3A3] leading-relaxed">
                Bu alanı kategori mantığıyla bölerek büyütmeye başladım. Şu an görünüm, okuma deneyimi, veri sunumu ve gelecekteki üyelik/abonelik akışları için net bir iskelet var.
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] p-4">
                <div className="text-[11px] uppercase tracking-wider text-[#A3A3A3] mb-1">Görünüm</div>
                <div className="text-xs text-[#666666] mb-4">Panelin renk yapısı ve genel yüzeyi.</div>
                <div className="space-y-2">
                  {[
                    { value: 'dark' as const, label: 'Koyu', note: 'Mevcut görünüm' },
                    { value: 'graphite' as const, label: 'Grafit', note: 'Biraz daha yumuşak kontrast' },
                    { value: 'light' as const, label: 'Açık', note: 'Gündüz okuması için' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSettings((current) => ({ ...current, theme: option.value }))}
                      className={`w-full rounded-sm border px-3 py-3 text-left transition-colors ${
                        settings.theme === option.value
                          ? 'border-[#2D2D2D] bg-[#0D0D0D]'
                          : 'border-[#1F1F1F] bg-[#111111] hover:bg-[#141414]'
                      }`}
                    >
                      <div className="text-sm text-[#E5E5E5]">{option.label}</div>
                      <div className="text-xs text-[#666666] mt-1">{option.note}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] p-4">
                <div className="text-[11px] uppercase tracking-wider text-[#A3A3A3] mb-1">Okuma Deneyimi</div>
                <div className="text-xs text-[#666666] mb-4">Hareket, metin yoğunluğu ve rehber davranışı.</div>
                <div className="space-y-3">
                  <ToggleRow
                    label="Azaltılmış hareket"
                    description="Animasyon ve geçişleri yumuşatır."
                    checked={settings.reducedMotion}
                    onChange={(checked) => setSettings((current) => ({ ...current, reducedMotion: checked }))}
                  />
                  <ToggleRow
                    label="Metrik rehberi açık başlasın"
                    description="Kategori sayfasında rehber bölümü varsayılan açık gelsin."
                    checked={settings.guideDefaultOpen}
                    onChange={(checked) => setSettings((current) => ({ ...current, guideDefaultOpen: checked }))}
                  />
                  <ToggleRow
                    label="Kompakt yazı düzeni"
                    description="Genel metin ölçeğini biraz sıkılaştırır; yoğun kullanım için daha uygundur."
                    checked={settings.compactText}
                    onChange={(checked) => setSettings((current) => ({ ...current, compactText: checked }))}
                  />
                </div>
              </div>

              <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] p-4">
                <div className="text-[11px] uppercase tracking-wider text-[#A3A3A3] mb-1">Veri Sunumu</div>
                <div className="text-xs text-[#666666] mb-4">Kartlarda ve kategori sonlarında gösterilen yardımcı bilgiler.</div>
                <div className="space-y-3">
                  <ToggleRow
                    label="Metrik tarihlerini göster"
                    description="Kartlardaki son veri tarihini görünür tutar."
                    checked={settings.showMetricDates}
                    onChange={(checked) => setSettings((current) => ({ ...current, showMetricDates: checked }))}
                  />
                  <ToggleRow
                    label="Yasal notu göster"
                    description="Kategori sonundaki kısa bilgilendirme ve yasal not görünür kalsın."
                    checked={settings.showLegalNote}
                    onChange={(checked) => setSettings((current) => ({ ...current, showLegalNote: checked }))}
                  />
                </div>
              </div>

              <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] p-4">
                <div className="text-[11px] uppercase tracking-wider text-[#A3A3A3] mb-1">Üyelik ve Abonelik</div>
                <div className="text-xs text-[#666666] mb-4">Henüz aktif değil ama yerini şimdiden ayırdım.</div>
                <div className="space-y-3 text-sm text-[#A3A3A3] leading-relaxed">
                  <div className="rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] p-3">
                    <div className="text-[#E5E5E5] mb-1">Free</div>
                    <div className="text-xs text-[#666666]">Temel dashboard görünümü ve manuel kullanım.</div>
                  </div>
                  <div className="rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] p-3">
                    <div className="text-[#E5E5E5] mb-1">Pro</div>
                    <div className="text-xs text-[#666666]">Kaydedilmiş düzenler, özel alarm akışları, geniş AI kullanım limiti.</div>
                  </div>
                  <div className="rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] p-3">
                    <div className="text-[#E5E5E5] mb-1">Institutional</div>
                    <div className="text-xs text-[#666666]">Takım üyeliği, paylaşılmış workspace ve rol bazlı erişim mantığı için hazır alan.</div>
                  </div>
                </div>
              </div>

              <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] p-4 xl:col-span-2">
                <div className="text-[11px] uppercase tracking-wider text-[#A3A3A3] mb-1">Yakında Eklenebilecekler</div>
                <div className="text-xs text-[#666666] mb-4">Sonraki adım için en mantıklı ayar başlıkları.</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-[#A3A3A3]">
                  <div className="rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] p-3">Kategori bazlı bildirim tercihleri</div>
                  <div className="rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] p-3">Kaydedilmiş dashboard düzenleri</div>
                  <div className="rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] p-3">AI model seçimi ve kullanım limiti</div>
                </div>
              </div>
            </div>
          </div>
        ) : selectedCategoryId === CRYPTO_CATEGORY_ID ? (
          isCategoryTransitioning ? (
            <LoadingPanel label="Kripto metrikleri yükleniyor..." />
          ) : (
          <CryptoPage
            pilotMetrics={data?.pilotMetrics ?? []}
            aiInsight={data?.aiInsight ?? null}
            aiSimpleSummary={data?.aiSimpleSummary ?? null}
            aiConfidence={data?.aiConfidence ?? null}
            guideDefaultOpen={settings.guideDefaultOpen}
            showMetricDates={settings.showMetricDates}
            showLegalNote={settings.showLegalNote}
          />
          )
        ) : (
          <div>
            {isCategoryTransitioning ? (
              <LoadingPanel label={`${data?.categories.find(c => c.id === selectedCategoryId)?.name || PLACEHOLDERS[selectedCategoryId] || 'Kategori'} metrikleri yükleniyor...`} />
            ) : (
              <>
                {/* AI Insight Card */}
                <div className="bg-[#111111] border border-[#1F1F1F] p-4 rounded-sm mb-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${data?.aiInsight ? 'bg-[#4ADE80] animate-pulse' : 'bg-[#666666]'}`}></div>
                    <div className="text-sm md:text-base font-semibold text-[#E5E5E5] tracking-wide leading-snug">
                      MERGEN AI {data?.categories.find(c => c.id === selectedCategoryId)?.name || PLACEHOLDERS[selectedCategoryId] || 'Kategori'} Analizi
                    </div>
                    {data?.aiConfidence !== null && data?.aiConfidence !== undefined && (
                      <ConfidenceBadge confidence={data.aiConfidence} />
                    )}
                  </div>
                  {data?.aiInsight ? (
                    <>
                      <div className="text-sm text-[#E5E5E5] leading-relaxed">
                        {data.aiInsight}
                      </div>
                      {data.aiSimpleSummary && (
                        <div className="mt-4 pt-4 border-t border-[#1F1F1F]">
                          <div className="text-[10px] text-[#A3A3A3] uppercase tracking-wider mb-2">
                            Sade Özet
                          </div>
                          <div className="text-sm text-[#D4D4D4] leading-relaxed">
                            {data.aiSimpleSummary}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-[#666666] leading-relaxed">
                      Bu kategori icin henuz AI yorumu olusmadi. Gemini kotasi doluysa kart bos kalabilir. Daha sonra tekrar deneyiniz.
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-medium">
                    {data?.categories.find(c => c.id === selectedCategoryId)?.name || PLACEHOLDERS[selectedCategoryId] || 'Kategori'} Metrikleri
                  </div>
                </div>

                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] px-4 py-3">
                    <div className="text-[10px] uppercase tracking-wider text-[#666666] mb-1">Veri kapsaması</div>
                    <div className="text-sm text-[#E5E5E5] font-mono tabular-nums">%{selectedCoverageRatio}</div>
                    <div className="text-xs text-[#666666] mt-1">{selectedFetchedMetrics}/{selectedCategoryMetrics.length} metrik dolu</div>
                  </div>
                  <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] px-4 py-3">
                    <div className="text-[10px] uppercase tracking-wider text-[#666666] mb-1">AI güven</div>
                    <div className="text-sm text-[#E5E5E5] font-mono tabular-nums">{selectedAiReliability}/5</div>
                    <div className="text-xs text-[#666666] mt-1">Veri yoğunluğu ve yorum güveni birlikte okunmalı</div>
                  </div>
                  <div className="rounded-sm border border-[#1F1F1F] bg-[#111111] px-4 py-3">
                    <div className="text-[10px] uppercase tracking-wider text-[#666666] mb-1">Son güncelleme</div>
                    <div className="text-sm text-[#E5E5E5] font-mono tabular-nums">{formatLastUpdateLabel(selectedLastUpdate)}</div>
                    <div className="text-xs text-[#666666] mt-1">Kategori içindeki en güncel veri zamanı</div>
                  </div>
                </div>

                {data?.pilotMetrics && data.pilotMetrics.length > 0 ? (
                  <div className="space-y-8">
                    {groupMetrics(selectedCategoryId, data.pilotMetrics).map((group) => {
                      const tone = getGroupTone(group.title);
                      return (
                      <div key={group.title}>
                        <div
                          className={`relative mb-4 rounded-sm border px-4 py-3 ${tone.border} ${tone.bg}`}
                          style={{
                            backgroundImage: `linear-gradient(135deg, ${tone.accent}14 0%, transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)`,
                            boxShadow: tone.glow,
                          }}
                        >
                          <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-sm" style={{ backgroundColor: tone.accent }}></div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-[11px] text-[#A3A3A3] uppercase tracking-wider">
                                <span
                                  className={`flex h-7 w-7 items-center justify-center rounded-sm border ${tone.border} ${tone.softBg} ${tone.icon}`}
                                  style={{ boxShadow: `inset 0 0 18px ${tone.accent}12` }}
                                >
                                  {getGroupIcon(group.title)}
                                </span>
                                <span className="text-[#D4D4D4]">{group.title}</span>
                              </div>
                              <div className="text-xs text-[#8A8A8A] mt-1 leading-relaxed">
                                {group.description}
                              </div>
                            </div>
                            <div
                              className={`shrink-0 rounded-sm border px-2 py-1 text-[10px] uppercase tracking-wider text-[#A3A3A3] ${tone.border} ${tone.softBg}`}
                              style={{ boxShadow: `inset 0 0 14px ${tone.accent}10` }}
                            >
                              {group.metrics.length} metrik
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {group.metrics.map((metric) => (
                            <MetricCard 
                              key={metric.id}
                              name={metric.name} 
                              symbol={metric.symbol}
                              source={metric.source}
                              latestDate={metric.latestDate}
                              cadence={metric.cadence}
                              value={metric.value} 
                              unit={metric.symbol === 'BAMLH0A0HYM2' ? '%' : ''} 
                              change={metric.change} 
                              changePct={metric.changePct} 
                              trend={metric.trend} 
                              history={metric.history}
                              showMetricDates={settings.showMetricDates}
                            />
                          ))}
                        </div>
                      </div>
                    )})}
                  </div>
                ) : (
                  <div className="text-sm text-[#666666] font-mono py-8 text-center border border-dashed border-[#1F1F1F]">
                    Bu kategori için henüz metrik eklenmemiş veya veri çekilmemiş.
                  </div>
                )}

                {data?.pilotMetrics && data.pilotMetrics.length > 0 && (
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
                            Bu bölüm, her metriğin neyi anlattığını ve yüksek ya da düşük okunmasının genel olarak hangi rejime işaret ettiğini hızlı okumak için hazırlandı.
                          </div>
                        </div>
                        <div className="shrink-0 rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] px-3 py-2 text-[10px] uppercase tracking-wider text-[#A3A3A3]">
                          {isGuideOpen ? 'Gizle' : 'Aç'}
                        </div>
                      </div>
                    </button>
                    {isGuideOpen && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {data.pilotMetrics.map((metric) => {
                          const meaning = getMetricMeaning(metric);
                          const lowTone = metric.isInverse
                            ? 'border-[#16351F] bg-[#0D120D]'
                            : 'border-[#3C3113] bg-[#120F0A]';
                          const highTone = metric.isInverse
                            ? 'border-[#3F1818] bg-[#140B0B]'
                            : 'border-[#16351F] bg-[#0D120D]';

                          return (
                            <div key={`${metric.id}-guide`} className="rounded-sm border border-[#1F1F1F] bg-[#111111] p-4">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div>
                                  <div className="text-[13px] font-medium text-[#E5E5E5]">{metric.name}</div>
                                  <div className="mt-1 text-[10px] uppercase tracking-wider text-[#666666]">{metric.symbol}</div>
                                </div>
                                <div className="shrink-0 rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] px-2 py-1 text-[10px] uppercase tracking-wider text-[#666666]">
                                  {metric.cadence === 'annual' ? 'yapısal' : 'aktif'}
                                </div>
                              </div>
                              <div className="text-[12px] text-[#A3A3A3] leading-relaxed">
                                {meaning.base}
                              </div>
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

                {selectedCategoryId === FED_POWER_CATEGORY_ID && data?.fedProfiles.length > 0 && (
                  <div className="mt-8">
                    <div className="text-sm font-medium uppercase tracking-wider text-[#A3A3A3] mb-4">
                      Fed Güç Haritası
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {data.fedProfiles.map((profile) => (
                        <div key={profile.name} className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <div className="text-sm font-semibold text-[#E5E5E5]">{profile.name}</div>
                              <div className="text-[11px] uppercase tracking-wider text-[#A3A3A3] mt-1">{profile.role}</div>
                            </div>
                            <div className="text-[10px] text-[#A3A3A3] border border-[#1F1F1F] px-2 py-1 rounded-sm">
                              {profile.origin}
                            </div>
                          </div>
                          <div className="space-y-3 text-sm text-[#D4D4D4]">
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-[#666666] mb-1">Önceki Kurumlar</div>
                              <div>{profile.priorInstitutions.join(', ')}</div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-[#666666] mb-1">Siyasi Eğilim</div>
                              <div>{profile.politicalTilt}</div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-[#666666] mb-1">Faiz Bakışı</div>
                              <div>{profile.rateView}</div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-[#666666] mb-1">Bilinen Bağlantılar</div>
                              <div>{profile.knownLinks.join(', ')}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {settings.showLegalNote && (
                  <div className="mt-10 pt-6 border-t border-[#1F1F1F]">
                    <div className="text-xs text-[#666666] leading-relaxed max-w-4xl">
                      MERGEN INTELLIGENCE, makroekonomik ve yapısal sinyalleri izlemek için tasarlanmış bir izleme panelidir. Buradaki skorlar, yorumlar ve metrik açıklamaları yalnızca bilgi amaçlıdır; yatırım tavsiyesi, finansal danışmanlık, hukuki görüş veya resmi politika yönlendirmesi yerine geçmez.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const clamped = Math.max(0, Math.min(5, confidence));

  return (
    <div className="ml-auto flex items-center gap-3 border border-[#1F1F1F] bg-[#0D0D0D] px-3 py-2 rounded-sm">
      <div className="text-sm font-semibold text-[#E5E5E5] whitespace-nowrap">
        Güven {clamped}/5
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={`h-2.5 w-5 rounded-[2px] border ${
              index < clamped
                ? 'border-[#4ADE80] bg-[#4ADE80]'
                : 'border-[#2A2A2A] bg-transparent'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-4 rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] p-3 text-left hover:bg-[#101010] transition-colors"
    >
      <div>
        <div className="text-sm text-[#E5E5E5]">{label}</div>
        <div className="mt-1 text-xs text-[#666666] leading-relaxed">{description}</div>
      </div>
      <div className={`mt-0.5 h-6 w-11 shrink-0 rounded-full border px-1 transition-colors ${checked ? 'border-[#16351F] bg-[#102014]' : 'border-[#2A2A2A] bg-[#111111]'}`}>
        <div className={`h-4 w-4 rounded-full transition-transform mt-[3px] ${checked ? 'translate-x-5 bg-[#4ADE80]' : 'translate-x-0 bg-[#666666]'}`}></div>
      </div>
    </button>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="rounded-sm border border-dashed border-[#1F1F1F] bg-[#111111] px-4 py-12">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-2 border-[#1F1F1F]"></div>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#A3A3A3] border-r-[#666666] animate-spin"></div>
        </div>
        <div className="space-y-2">
          <div className="text-sm text-[#A3A3A3] font-mono">{label}</div>
          <div className="flex items-center justify-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#666666] animate-pulse"></span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#666666] animate-pulse [animation-delay:120ms]"></span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#666666] animate-pulse [animation-delay:240ms]"></span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreCircle({ score, name, trend, onClick }: { key?: React.Key; score: number | null, name: string, trend: string, onClick: () => void }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = score !== null ? circumference - (score / 100) * circumference : circumference;
  const tone = getScoreTone(score);
  const color = tone.color;
  const scoreWord = getScoreWord(score);

  return (
    <div onClick={onClick} className={`relative flex flex-col items-center p-4 border rounded-sm cursor-pointer transition-colors group hover:bg-[#141414] ${tone.bg} ${tone.border}`}>
      <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-sm" style={{ backgroundColor: color }}></div>
      <div className="relative flex items-center justify-center w-24 h-24 mb-3">
        <svg className="transform -rotate-90 w-24 h-24">
          <circle cx="48" cy="48" r={radius} stroke="#1F1F1F" strokeWidth="6" fill="none" />
          {score !== null && (
            <circle 
              cx="48" cy="48" r={radius} 
              stroke={color} 
              strokeWidth="6" 
              fill="none" 
              strokeDasharray={circumference} 
              strokeDashoffset={strokeDashoffset} 
              className="transition-all duration-1000 ease-out" 
            />
          )}
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-xl font-mono font-bold" style={{ color }}>{score !== null ? score : '--'}</span>
        </div>
      </div>
      <div className="text-xs text-center font-medium text-[#A3A3A3] group-hover:text-[#E5E5E5] transition-colors h-8 flex items-center justify-center">
        {name}
      </div>
      <div className="mt-2 text-[10px] uppercase tracking-wider font-medium" style={{ color }}>
        {scoreWord}
      </div>
    </div>
  );
}

interface MetricCardProps {
  key?: React.Key;
  name: string;
  symbol: string;
  source: string;
  latestDate: string | null;
  cadence: 'daily' | 'annual';
  value: number | null;
  unit: string;
  change: number | null;
  changePct: number | null;
  trend: 'up' | 'down' | 'flat';
  history?: { date: string; value: number }[];
  showMetricDates?: boolean;
}

function MetricCard({ name, symbol, source, latestDate, cadence, value, unit, change, changePct, trend, history, showMetricDates = true }: MetricCardProps) {
  const isChangePositive = change !== null && change > 0;
  const isChangeNegative = change !== null && change < 0;
  const changeColor = isChangePositive ? 'text-[#4ADE80]' : isChangeNegative ? 'text-[#F87171]' : 'text-[#666666]';
  const strokeColor = isChangePositive ? '#4ADE80' : isChangeNegative ? '#F87171' : '#666666';
  const isAnnual = cadence === 'annual';
  const trendAccent = isChangePositive ? '#4ADE80' : isChangeNegative ? '#F87171' : '#666666';
  const cadenceLabel = isAnnual ? 'yapisal' : 'aktif';

  const formatValue = (val: number | null) => {
    if (val === null) return '--';
    if (symbol.startsWith('WID_')) return `${(val * 100).toFixed(1)}`;
    if (source === 'VDEM') return val.toFixed(3);
    return val.toFixed(2);
  };
  const formatChange = (val: number | null) => {
    if (val === null) return '--';
    const prefix = val > 0 ? '+' : '';
    if (symbol.startsWith('WID_')) return `${prefix}${(val * 100).toFixed(1)} pp`;
    if (source === 'VDEM') return `${prefix}${val.toFixed(3)}`;
    return `${prefix}${val.toFixed(2)}`;
  };
  const formatChangePct = (val: number | null) => {
    if (val === null) return '--';
    const prefix = val > 0 ? '+' : '';
    return `${prefix}${val.toFixed(2)}%`;
  };
  const latestLabel = latestDate
    ? (isAnnual ? new Date(latestDate).getFullYear().toString() : latestDate)
    : '--';
  const periodLabel = isAnnual ? 'Yillik degisim' : 'Son degisim';
  const emptyChartLabel = isAnnual ? 'Yillik seri bekleniyor' : 'Yeterli veri yok';

  return (
    <div className="relative bg-[#111111] border border-[#1F1F1F] p-4 rounded-sm hover:bg-[#141414] transition-colors group flex flex-col justify-between overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[2px]" style={{ backgroundColor: trendAccent }}></div>
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] px-3 py-2.5">
              <div className="text-[13px] leading-snug text-[#E5E5E5] break-words">
                {name}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] px-2 py-1 text-[10px] font-mono text-[#A3A3A3]">
                {symbol}
              </span>
              <span className="rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] px-2 py-1 text-[10px] uppercase tracking-wider text-[#666666]">
                {cadenceLabel}
              </span>
            </div>
          </div>
          <div className={`flex items-center gap-1 text-xs font-mono tabular-nums ${changeColor}`}>
            {isChangePositive && <ArrowUp className="w-3 h-3" />}
            {isChangeNegative && <ArrowDown className="w-3 h-3" />}
            {(!isChangePositive && !isChangeNegative) && <Minus className="w-3 h-3" />}
            {formatChange(change)}
          </div>
        </div>
        <div className="rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] p-3">
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-2xl font-mono tabular-nums">{formatValue(value)}</span>
              {unit && value !== null && <span className="text-xs text-[#666666] font-mono">{unit}</span>}
              {!unit && symbol.startsWith('WID_') && value !== null && <span className="text-xs text-[#666666] font-mono">%</span>}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-[#666666] shrink-0">
              {source}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-mono text-[#666666]">
            <div className="rounded-sm border border-[#1F1F1F] px-2 py-2">
              <div className="uppercase tracking-wider mb-1">{periodLabel}</div>
              <div className="tabular-nums text-[#A3A3A3]">{formatChangePct(changePct)}</div>
            </div>
            <div className="rounded-sm border border-[#1F1F1F] px-2 py-2">
              <div className="uppercase tracking-wider mb-1">{showMetricDates ? 'Son veri' : 'Durum'}</div>
              <div className="tabular-nums text-[#A3A3A3]">{showMetricDates ? latestLabel : 'Gizli'}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sparkline Chart */}
      <div className="h-12 mt-4 w-full rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] px-2 py-1 opacity-70 group-hover:opacity-100 transition-opacity">
        {history && history.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <YAxis domain={['dataMin', 'dataMax']} hide />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={strokeColor} 
                strokeWidth={1.5} 
                dot={false} 
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[9px] text-[#333333] font-mono">
            {emptyChartLabel}
          </div>
        )}
      </div>
    </div>
  );
}

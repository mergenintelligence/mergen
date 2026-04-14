-- Public finance and sovereign debt category extension seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  ('39000000-0000-0000-0000-000000000006','30000000-0000-0000-0000-000000000009','ABD 2Y - 10Y Getiri Eğrisi','T10Y2Y_PUBLIC','FRED','ABD 2 yillik ve 10 yillik hazine getirileri arasindaki klasik egri makasini temsil eder.',false,1.5),
  ('39000000-0000-0000-0000-000000000007','30000000-0000-0000-0000-000000000009','Hazine Tahvil İhalesi Karşılama Oranları','TREASURY_BID_TO_COVER','SOVEREIGN_MANUAL','ABD hazine ihalelerine gelen talebin gucunu temsil eder.',false,1.3),
  ('39000000-0000-0000-0000-000000000008','30000000-0000-0000-0000-000000000009','Faiz Giderleri / Toplam Vergi Geliri','INTEREST_EXPENSE_TO_TAX_REVENUE','SOVEREIGN_MANUAL','Faiz giderlerinin vergi gelirleri uzerindeki yukunu temsil eder.',true,1.4),
  ('39000000-0000-0000-0000-000000000009','30000000-0000-0000-0000-000000000009','Almanya - İtalya 10Y Spread','BUND_BTP_10Y_SPREAD','SOVEREIGN_MANUAL','Euro bolgesi icindeki parcalanma ve cevresel risk baskisini temsil eder.',true,1.3),
  ('39000000-0000-0000-0000-000000000010','30000000-0000-0000-0000-000000000009','Japonya 10Y YCC Seviyesi','JGB_YCC_LEVEL','SOVEREIGN_MANUAL','Japonya getiri egri kontrol rejiminin fiili sinirini temsil eder.',true,1.1),
  ('39000000-0000-0000-0000-000000000011','30000000-0000-0000-0000-000000000009','Fed''in Hazine Tahvili Sahiplik Oranı','FED_TSY_HOLDINGS_SHARE','SOVEREIGN_MANUAL','Fed bilancosundaki hazine tahvili payini ve QT etkisini temsil eder.',true,1.2),
  ('39000000-0000-0000-0000-000000000012','30000000-0000-0000-0000-000000000009','Ülke Borçlarının Ortalama Vadesi','SOVEREIGN_DURATION_AVG','SOVEREIGN_MANUAL','Borclanmanin ortalama vadesi uzerinden faiz duyarliligini temsil eder.',false,1.0),
  ('39000000-0000-0000-0000-000000000013','30000000-0000-0000-0000-000000000009','ICE BofA MOVE Index','MOVE_SOVEREIGN','SOVEREIGN_MANUAL','Tahvil volatilitesinin devlet borclanma riskine yansimasini temsil eder.',true,1.4),
  ('39000000-0000-0000-0000-000000000014','30000000-0000-0000-0000-000000000009','ABD Net Faiz Gideri / GSYİH','US_NET_INTEREST_GDP','SOVEREIGN_MANUAL','Net faiz yukunun milli gelire oranini temsil eder.',true,1.3),
  ('39000000-0000-0000-0000-000000000015','30000000-0000-0000-0000-000000000009','ABD Net Faiz Gideri / Federal Gelirler','US_NET_INTEREST_REVENUE','SOVEREIGN_MANUAL','Net faiz giderlerinin federal gelirler icindeki payini temsil eder.',true,1.4),
  ('39000000-0000-0000-0000-000000000016','30000000-0000-0000-0000-000000000009','ABD Treasury Term Premium','US_TERM_PREMIUM','SOVEREIGN_MANUAL','Uzun vadeli ABD tahvillerinde vade primi baskisini temsil eder.',true,1.2),
  ('39000000-0000-0000-0000-000000000017','30000000-0000-0000-0000-000000000009','ABD 30Y - 3M Getiri Eğrisi','US_30Y_3M_CURVE','SOVEREIGN_MANUAL','En uzun vadeli egri ile kisa vade arasindaki makasi temsil eder.',false,1.2),
  ('39000000-0000-0000-0000-000000000018','30000000-0000-0000-0000-000000000009','ABD 5Y5Y Enflasyon Swapı','US_5Y5Y_INFLATION_SWAP','SOVEREIGN_MANUAL','Orta-uzun vadeli piyasa bazli enflasyon beklentisini temsil eder.',true,1.2),
  ('39000000-0000-0000-0000-000000000019','30000000-0000-0000-0000-000000000009','ABD 10Y Nominal - 10Y Reel Faiz Farkı','US_10Y_NOMINAL_REAL_SPREAD','SOVEREIGN_MANUAL','Nominal ve reel faiz arasindaki enflasyon telafi bileşenini temsil eder.',true,1.1),
  ('39000000-0000-0000-0000-000000000020','30000000-0000-0000-0000-000000000009','Yabancı Resmi Kurumların ABD Hazine Tahvili Sahipliği','FOREIGN_OFFICIAL_TSY_HOLDINGS','SOVEREIGN_MANUAL','Yabanci resmi kurumlarin ABD hazine talebini temsil eder.',false,1.2),
  ('39000000-0000-0000-0000-000000000021','30000000-0000-0000-0000-000000000009','Treasury General Account (TGA) Bakiyesi','TGA_SOVEREIGN','FRED','ABD Hazinesi nakit hesabinin seviyesini temsil eder.',true,1.1),
  ('39000000-0000-0000-0000-000000000022','30000000-0000-0000-0000-000000000009','ABD Bill İhraç Payı / Toplam İhraç','BILL_ISSUANCE_SHARE','SOVEREIGN_MANUAL','Kisa vadeli borclanmanin toplam ihraç icindeki payini temsil eder.',true,1.1),
  ('39000000-0000-0000-0000-000000000023','30000000-0000-0000-0000-000000000009','ABD Ortalama Borçlanma Maliyeti','AVG_FUNDING_COST_US','SOVEREIGN_MANUAL','ABD hazine stokunun ortalama finansman maliyetini temsil eder.',true,1.2),
  ('39000000-0000-0000-0000-000000000024','30000000-0000-0000-0000-000000000009','ABD Sovereign CDS (5Y)','US_SOVEREIGN_CDS_5Y','SOVEREIGN_MANUAL','ABD devlet temerrut sigortasi maliyetini temsil eder.',true,1.0),
  ('39000000-0000-0000-0000-000000000025','30000000-0000-0000-0000-000000000009','Fransa - Almanya 10Y Spread','FR_DE_10Y_SPREAD','SOVEREIGN_MANUAL','Fransa ile Almanya tahvil spreadi uzerinden cekirdek euro riskini temsil eder.',true,1.0),
  ('39000000-0000-0000-0000-000000000026','30000000-0000-0000-0000-000000000009','İspanya - Almanya 10Y Spread','ES_DE_10Y_SPREAD','SOVEREIGN_MANUAL','Ispanya ile Almanya spreadi uzerinden euro cevre riskini temsil eder.',true,1.0),
  ('39000000-0000-0000-0000-000000000027','30000000-0000-0000-0000-000000000009','Yunanistan - Almanya 10Y Spread','GR_DE_10Y_SPREAD','SOVEREIGN_MANUAL','Yunanistan ile Almanya spreadi uzerinden euro bolgesi asiri risk primini temsil eder.',true,1.0)
ON CONFLICT (symbol) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  description = EXCLUDED.description,
  is_inverse = EXCLUDED.is_inverse,
  weight = EXCLUDED.weight;

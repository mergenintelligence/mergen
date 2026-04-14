-- Emerging markets category extension seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  ('40000000-0000-0000-0000-000000000006','30000000-0000-0000-0000-000000000010','JPMorgan EMBI Global Diversified Spread','JPM_EMBI_GLOBAL_DIVERSIFIED_SPREAD','EM_MANUAL','Gelismekte olan ulke dolar tahvillerinin spread baskisini temsil eder.',true,1.6),
  ('40000000-0000-0000-0000-000000000007','30000000-0000-0000-0000-000000000010','JPMorgan GBI-EM Global Diversified Index','JPM_GBI_EM_GLOBAL_DIVERSIFIED_INDEX','EM_MANUAL','Yerel para cinsi EM devlet tahvillerinin genel performansini temsil eder.',false,1.4),
  ('40000000-0000-0000-0000-000000000008','30000000-0000-0000-0000-000000000010','iShares MSCI Emerging Markets ex China ETF','EMXC','YAHOO','Cin haric EM hisse genisligini temsil eden ETF gostergesi.',false,1.3),
  ('40000000-0000-0000-0000-000000000009','30000000-0000-0000-0000-000000000010','iShares MSCI Mexico ETF','EWW','YAHOO','Meksika piyasasi ve Kuzey Amerika tedarik zinciri baglantisini temsil eden ETF gostergesi.',false,1.0),
  ('40000000-0000-0000-0000-000000000010','30000000-0000-0000-0000-000000000010','iShares MSCI Indonesia ETF','EIDO','YAHOO','Endonezya uzerinden ASEAN talep ve emtia baglantisini temsil eden ETF gostergesi.',false,1.0),
  ('40000000-0000-0000-0000-000000000011','30000000-0000-0000-0000-000000000010','VanEck Vietnam ETF','VNM','YAHOO','Vietnam uretim kaymasi ve Cin alternatifi buyume anlatısını temsil eden ETF gostergesi.',false,1.0),
  ('40000000-0000-0000-0000-000000000012','30000000-0000-0000-0000-000000000010','Güney Afrika Randı / ABD Doları Kuru','DEXSFUS','FRED','Rand uzerinden EM kur stresi ve emtia hassasiyetini temsil eder.',true,1.0),
  ('40000000-0000-0000-0000-000000000013','30000000-0000-0000-0000-000000000010','Offshore Yuan / Onshore Yuan Spreadi','CNH_CNY_SPREAD','EM_MANUAL','Offshore ve onshore yuan arasindaki ayrismayi temsil eden sermaye kontrol stresi gostergesi.',true,1.2),
  ('40000000-0000-0000-0000-000000000014','30000000-0000-0000-0000-000000000010','Çin Toplam Sosyal Finansman','CHINA_TOTAL_SOCIAL_FINANCING','EM_MANUAL','Cin kredi yaratimi ve genis finansman impulsunu temsil eder.',false,1.4),
  ('40000000-0000-0000-0000-000000000015','30000000-0000-0000-0000-000000000010','Çin Kredi Dürtüsü','CHINA_CREDIT_IMPULSE','EM_MANUAL','Cin ekonomisindeki kredi ivmesinin buyumeye oncu etkisini temsil eder.',false,1.5),
  ('40000000-0000-0000-0000-000000000016','30000000-0000-0000-0000-000000000010','EM Local Currency Bond Yield Endeksi','EM_LOCAL_CURRENCY_BOND_YIELD_INDEX','EM_MANUAL','EM yerel para tahvillerindeki getiri baskisini temsil eder.',true,1.3),
  ('40000000-0000-0000-0000-000000000017','30000000-0000-0000-0000-000000000010','EM High Yield Corporate OAS','EM_HIGH_YIELD_CORP_OAS','EM_MANUAL','EM yuksek getirili sirket tahvillerinin spread baskisini temsil eder.',true,1.4),
  ('40000000-0000-0000-0000-000000000018','30000000-0000-0000-0000-000000000010','Döviz Rezervi / Kısa Vadeli Dış Borç Oranı','FX_RESERVES_ST_DEBT_RATIO','EM_MANUAL','Rezerv yeterliliginin kisa vadeli dis borca karsi tampon kapasitesini temsil eder.',false,1.3),
  ('40000000-0000-0000-0000-000000000019','30000000-0000-0000-0000-000000000010','EM İmalat PMI Sepeti','EM_MANUFACTURING_PMI_BASKET','EM_MANUAL','Gelismekte olan ulkelerde sanayi aktivitesinin ortak yonunu temsil eder.',false,1.3),
  ('40000000-0000-0000-0000-000000000020','30000000-0000-0000-0000-000000000010','EM Yeni İhracat Siparişleri Endeksi','EM_EXPORT_NEW_ORDERS_INDEX','EM_MANUAL','EM dis talep ve ihracat cephesindeki oncu siparis akisini temsil eder.',false,1.2),
  ('40000000-0000-0000-0000-000000000021','30000000-0000-0000-0000-000000000010','WisdomTree India Earnings Fund','EPI','YAHOO','Cin alternatifi buyume motoru olarak Hindistan temasini temsil eden ETF gostergesi.',false,1.2),
  ('40000000-0000-0000-0000-000000000022','30000000-0000-0000-0000-000000000010','iShares MSCI Turkey ETF','TUR','YAHOO','Yuksek oynaklik ve jeopolitik risk barometresi olarak Turkiye temasini temsil eden ETF gostergesi.',true,0.9),
  ('40000000-0000-0000-0000-000000000023','30000000-0000-0000-0000-000000000010','iShares MSCI Taiwan ETF','EWT','YAHOO','Kuresel teknoloji ve cip arzi ile baglantili Tayvan temasini temsil eden ETF gostergesi.',false,1.1),
  ('40000000-0000-0000-0000-000000000024','30000000-0000-0000-0000-000000000010','VXEEM (EM Volatilite Endeksi)','VXEEM_EM','EM_MANUAL','Gelismekte olan piyasalardaki korku seviyesini temsil eden volatilite gostergesi.',true,1.3),
  ('40000000-0000-0000-0000-000000000025','30000000-0000-0000-0000-000000000010','EM Currency Index (ADXY)','ADXY_INDEX','EM_MANUAL','Asya ve diger EM para birimlerinin toplu gucunu temsil eden kur sepeti gostergesi.',false,1.1),
  ('40000000-0000-0000-0000-000000000026','30000000-0000-0000-0000-000000000010','EM CDS Spreadleri (5Y)','EM_CDS_SPREAD_5Y','EM_MANUAL','Gelismekte olan ulkelerde temerrut sigortasi maliyetinin ortalama baskisini temsil eder.',true,1.4),
  ('40000000-0000-0000-0000-000000000027','30000000-0000-0000-0000-000000000010','Net Sermaye Akışları (IIF Flows)','IIF_NET_CAPITAL_FLOWS','EM_MANUAL','Sicak paranin EM''e giris veya cikis hizini temsil eden net akim gostergesi.',false,1.4)
ON CONFLICT (symbol) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  description = EXCLUDED.description,
  is_inverse = EXCLUDED.is_inverse,
  weight = EXCLUDED.weight;

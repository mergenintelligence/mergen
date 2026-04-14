-- Agriculture and food security second extension seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  ('36000000-0000-0000-0000-000000000014','30000000-0000-0000-0000-000000000006','Pirinç Vadeli İşlemleri (Rough Rice)','ROUGH_RICE_FUTURES','AGRI_MANUAL','Asya ve gelismekte olan ulkeler icin temel gida istikrarini temsil eden pirinc fiyat gostergesidir.',true,1.1),
  ('36000000-0000-0000-0000-000000000015','30000000-0000-0000-0000-000000000006','Canlı Sığır Vadeli İşlemleri','LIVE_CATTLE_FUTURES','YAHOO','Protein bazli gida enflasyonunu temsil eden canli sigir vadeli fiyat gostergesidir.',true,1.0),
  ('36000000-0000-0000-0000-000000000016','30000000-0000-0000-0000-000000000006','Palm Yağı Vadeli İşlemleri','PALM_OIL_FUTURES','AGRI_MANUAL','Endustriyel gida uretiminde kritik girdi olan palm yagi maliyetini temsil eder.',true,1.0),
  ('36000000-0000-0000-0000-000000000017','30000000-0000-0000-0000-000000000006','Global X AgTech ETF','KROP','YAHOO','Tarimsal verimlilik ve agtech donusumunu temsil eden ETF gostergesidir.',false,0.9),
  ('36000000-0000-0000-0000-000000000018','30000000-0000-0000-0000-000000000006','Kakao Vadeli İşlemleri','CC=F','YAHOO','Kakao fiyatlari uzerinden tropikal gida arz baskisini temsil eder.',true,0.9),
  ('36000000-0000-0000-0000-000000000019','30000000-0000-0000-0000-000000000006','Lean Hogs Vadeli İşlemleri','LEAN_HOGS_FUTURES','AGRI_MANUAL','Domuz eti fiyatlari uzerinden protein zinciri baskisini temsil eder.',true,0.9),
  ('36000000-0000-0000-0000-000000000020','30000000-0000-0000-0000-000000000006','Süt Vadeli İşlemleri (Class III Milk)','CLASS_III_MILK_FUTURES','AGRI_MANUAL','Sut ve sut urunleri zincirindeki maliyet baskisini temsil eder.',true,0.9),
  ('36000000-0000-0000-0000-000000000021','30000000-0000-0000-0000-000000000006','Kanola Vadeli İşlemleri','CANOLA_FUTURES','AGRI_MANUAL','Bitkisel yag ve yem zinciri uzerindeki kanola maliyetini temsil eder.',true,0.9),
  ('36000000-0000-0000-0000-000000000022','30000000-0000-0000-0000-000000000006','Siyah Deniz Buğday FOB Fiyatı','BLACK_SEA_WHEAT_FOB','AGRI_MANUAL','Karadeniz buhday ihracat maliyetini temsil eden bolgesel referans fiyat gostergesidir.',true,1.0),
  ('36000000-0000-0000-0000-000000000023','30000000-0000-0000-0000-000000000006','USDA Crop Progress','USDA_CROP_PROGRESS','AGRI_MANUAL','USDA ekim ve hasat ilerleme hizini temsil eden tarimsal operasyon gostergesidir.',false,0.9),
  ('36000000-0000-0000-0000-000000000024','30000000-0000-0000-0000-000000000006','USDA Crop Condition','USDA_CROP_CONDITION','AGRI_MANUAL','USDA mahsul kondisyon skorunu temsil eden verim kalite gostergesidir.',false,1.0),
  ('36000000-0000-0000-0000-000000000025','30000000-0000-0000-0000-000000000006','El Niño / ENSO Endeksi','ENSO_INDEX','AGRI_MANUAL','Kuresel hava rejimini temsil eden ENSO iklim gostergesidir.',true,0.9),
  ('36000000-0000-0000-0000-000000000026','30000000-0000-0000-0000-000000000006','Kuraklık Şiddet Endeksi','DROUGHT_SEVERITY_INDEX','AGRI_MANUAL','Tarimsal arz soklari acisindan kurakligin siddetini temsil eder.',true,1.1),
  ('36000000-0000-0000-0000-000000000027','30000000-0000-0000-0000-000000000006','Toprak Nem Endeksi','SOIL_MOISTURE_INDEX','AGRI_MANUAL','Verim ve ekim kalitesi icin kritik olan toprak nem durumunu temsil eder.',false,1.0),
  ('36000000-0000-0000-0000-000000000028','30000000-0000-0000-0000-000000000006','DAP Gübre Fiyatı','DAP_FERTILIZER_PRICE','AGRI_MANUAL','DAP gubre maliyetini temsil eden fosfat bazli girdi gostergesidir.',true,0.9),
  ('36000000-0000-0000-0000-000000000029','30000000-0000-0000-0000-000000000006','Amonyak Gübre Fiyatı','AMMONIA_FERTILIZER_PRICE','AGRI_MANUAL','Amonyak bazli gubre maliyetini temsil eden azot girdi gostergesidir.',true,0.9),
  ('36000000-0000-0000-0000-000000000030','30000000-0000-0000-0000-000000000006','Arpa Vadeli İşlemleri','BARLEY_FUTURES','AGRI_MANUAL','Arpa fiyatlari uzerinden yem ve tahil zinciri baskisini temsil eder.',true,0.8),
  ('36000000-0000-0000-0000-000000000031','30000000-0000-0000-0000-000000000006','Yulaf Vadeli İşlemleri','OAT_FUTURES','AGRI_MANUAL','Yulaf fiyatlari uzerinden ikincil tahil stresini temsil eder.',true,0.8),
  ('36000000-0000-0000-0000-000000000032','30000000-0000-0000-0000-000000000006','Tavuk Eti Fiyat Endeksi','CHICKEN_PRICE_INDEX','AGRI_MANUAL','Beyaz et uzerinden protein bazli gida enflasyonunu temsil eder.',true,0.8),
  ('36000000-0000-0000-0000-000000000033','30000000-0000-0000-0000-000000000006','İç Gıda Fiyatları İzleme Endeksi','DOMESTIC_FOOD_MONITOR','AGRI_MANUAL','Ulke bazli ic gida fiyat baskilarinin ortalama yonunu temsil eder.',true,0.8)
ON CONFLICT (symbol) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  description = EXCLUDED.description,
  is_inverse = EXCLUDED.is_inverse,
  weight = EXCLUDED.weight;

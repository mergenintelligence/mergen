-- Energy security category extension seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  ('37000000-0000-0000-0000-000000000007','30000000-0000-0000-0000-000000000007','WTI / Brent Petrol Spreadi','WTI_BRENT_SPREAD','FRED_COMPOSITE','ABD ic arzı ile kuresel arz arasindaki farki temsil eden WTI-Brent spreadidir.',true,1.3),
  ('37000000-0000-0000-0000-000000000008','30000000-0000-0000-0000-000000000007','Hollanda TTF Doğalgaz Vadeli İşlemleri','TTF_GAS_FUTURES','ENERGY_MANUAL','Avrupa''nin gercek dogalgaz maliyetini temsil eden TTF fiyat gostergesidir.',true,1.4),
  ('37000000-0000-0000-0000-000000000009','30000000-0000-0000-0000-000000000007','Global X Uranium ETF','URA_ENERGY','YAHOO','Nukleer donusum ve baz yuk enerji temasini temsil eden uranyum ETF gostergesidir.',false,1.1),
  ('37000000-0000-0000-0000-000000000010','30000000-0000-0000-0000-000000000007','Rafineri Crack Spread','REFINERY_CRACK_SPREAD','ENERGY_MANUAL','Ham petrolun urune donusme karliligini temsil eden rafineri marj gostergesidir.',false,1.2),
  ('37000000-0000-0000-0000-000000000011','30000000-0000-0000-0000-000000000007','OPEC+ Atıl Kapasite','OPEC_SPARE_CAPACITY','ENERGY_MANUAL','Ani arz soklarina karsi piyasanin savunma kapasitesini temsil eder.',false,1.2),
  ('37000000-0000-0000-0000-000000000012','30000000-0000-0000-0000-000000000007','Kömür Vadeli İşlemleri (API2)','API2_COAL_FUTURES','ENERGY_MANUAL','Enerji krizlerinde baz enerjiye donusu temsil eden komur fiyat gostergesidir.',true,1.0),
  ('37000000-0000-0000-0000-000000000013','30000000-0000-0000-0000-000000000007','Elektrik Fiyat Endeksleri (Bölgesel)','REGIONAL_POWER_PRICES','ENERGY_MANUAL','Bolgesel elektrik maliyetlerinin veri merkezi ve sanayi talebine yansimasini temsil eder.',true,1.1),
  ('37000000-0000-0000-0000-000000000014','30000000-0000-0000-0000-000000000007','WTI Ham Petrol Vadeli İşlemleri','CL=F','YAHOO','WTI ham petrolun ABD ic piyasasindaki referans vadeli fiyatini temsil eder.',true,1.5),
  ('37000000-0000-0000-0000-000000000015','30000000-0000-0000-0000-000000000007','RBOB Benzin Vadeli İşlemleri','RB=F','YAHOO','ABD benzin vadeli fiyatlarini temsil eden rafine urun gostergesidir.',true,1.0),
  ('37000000-0000-0000-0000-000000000016','30000000-0000-0000-0000-000000000007','ULSD / Heating Oil Vadeli İşlemleri','HO=F','YAHOO','Distillate ve heating oil fiyatlarini temsil eden rafine urun gostergesidir.',true,1.0),
  ('37000000-0000-0000-0000-000000000017','30000000-0000-0000-0000-000000000007','LNG Japan Korea Marker (JKM)','JKM_LNG_MARKER','ENERGY_MANUAL','Asya LNG spot maliyetlerini temsil eden Japan Korea Marker gostergesidir.',true,1.2),
  ('37000000-0000-0000-0000-000000000018','30000000-0000-0000-0000-000000000007','ABD Ticari Ham Petrol Stokları','US_COMMERCIAL_CRUDE_STOCKS','ENERGY_MANUAL','ABD ticari ham petrol stok seviyesini temsil eder.',false,1.1),
  ('37000000-0000-0000-0000-000000000019','30000000-0000-0000-0000-000000000007','Cushing Petrol Stokları','CUSHING_CRUDE_STOCKS','ENERGY_MANUAL','WTI teslimat merkezi Cushing stok seviyesini temsil eder.',false,1.0),
  ('37000000-0000-0000-0000-000000000020','30000000-0000-0000-0000-000000000007','Distillate Fuel Stokları','DISTILLATE_FUEL_STOCKS','ENERGY_MANUAL','Distillate urun stok seviyelerini temsil eder.',false,0.9),
  ('37000000-0000-0000-0000-000000000021','30000000-0000-0000-0000-000000000007','Benzin Stokları','GASOLINE_STOCKS','ENERGY_MANUAL','ABD benzin stok seviyelerini temsil eder.',false,0.9),
  ('37000000-0000-0000-0000-000000000022','30000000-0000-0000-0000-000000000007','Rafineri Kapasite Kullanım Oranı','REFINERY_UTILIZATION_RATE','ENERGY_MANUAL','Rafineri sisteminin kapasite kullanim yogunlugunu temsil eder.',false,1.0),
  ('37000000-0000-0000-0000-000000000023','30000000-0000-0000-0000-000000000007','OECD Ticari Petrol Stokları','OECD_COMMERCIAL_OIL_STOCKS','ENERGY_MANUAL','OECD genelinde ticari petrol stok tamponunu temsil eder.',false,1.0),
  ('37000000-0000-0000-0000-000000000024','30000000-0000-0000-0000-000000000007','Baker Hughes Oil Rig Count','BAKER_HUGHES_OIL_RIG_COUNT','ENERGY_MANUAL','ABD petrol sondaj aktivitesini temsil eden rig sayisi gostergesidir.',false,1.0),
  ('37000000-0000-0000-0000-000000000025','30000000-0000-0000-0000-000000000007','Baker Hughes Gas Rig Count','BAKER_HUGHES_GAS_RIG_COUNT','ENERGY_MANUAL','ABD dogalgaz sondaj aktivitesini temsil eden rig sayisi gostergesidir.',false,1.0),
  ('37000000-0000-0000-0000-000000000026','30000000-0000-0000-0000-000000000007','ABD Ham Petrol Üretimi','US_CRUDE_OIL_PRODUCTION','ENERGY_MANUAL','ABD ham petrol uretim hacmini temsil eder.',false,1.1),
  ('37000000-0000-0000-0000-000000000027','30000000-0000-0000-0000-000000000007','EUA Karbon Emisyon İzinleri','EUA_CARBON_ALLOWANCES','ENERGY_MANUAL','Avrupa karbon fiyatlamasinin enerji maliyeti uzerindeki etkisini temsil eder.',true,0.9),
  ('37000000-0000-0000-0000-000000000028','30000000-0000-0000-0000-000000000007','Clean Spark Spread','CLEAN_SPARK_SPREAD','ENERGY_MANUAL','Gazdan elektrik uretim marjini temsil eden temiz spark spread gostergesidir.',false,0.9),
  ('37000000-0000-0000-0000-000000000029','30000000-0000-0000-0000-000000000007','Dark Spread','DARK_SPREAD','ENERGY_MANUAL','Komur bazli elektrik uretim marjini temsil eden dark spread gostergesidir.',false,0.9)
ON CONFLICT (symbol) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  description = EXCLUDED.description,
  is_inverse = EXCLUDED.is_inverse,
  weight = EXCLUDED.weight;

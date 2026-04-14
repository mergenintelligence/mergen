-- First wave category reinforcement metrics for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  ('51000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','ABD Ticari Kağıt (Commercial Paper) Spreadleri','COMMERCIAL_PAPER_SPREAD','CREDIT_MANUAL','Kisa vadeli sirket fonlama riskini ve ticari kredi piyasasi baskisini temsil eder.',true,1.3),
  ('51000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','Small Business Credit Survey (NFIB)','NFIB_CREDIT_SURVEY','CREDIT_MANUAL','Kucuk isletmelerin krediye erisim ve fonlama kosullari algisini temsil eder.',true,1.1),
  ('51000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','Leveraged Loan Index','LEVERAGED_LOAN_INDEX','CREDIT_MANUAL','Kaldiracli kredi piyasasindaki fiyatlama ve risk istahini temsil eder.',true,1.2),
  ('51000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000003','NFIB Küçük İşletme İyimserlik Endeksi','NFIB_SMALL_BUSINESS_OPTIMISM','REAL_ECON_MANUAL','Kucuk isletmelerin gelecege dair guvenini ve istihdam/harcama istahini temsil eder.',false,1.2),
  ('51000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000003','Cass Freight Index','CASS_FREIGHT_INDEX','REAL_ECON_MANUAL','Yuk tasimaciligi hacmi uzerinden reel ekonomi temposunu temsil eder.',false,1.1),
  ('51000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000003','Geçici İstihdam Oranı','TEMP_HELP_SERVICES','REAL_ECON_MANUAL','Gecici istihdam uzerinden sirketlerin erken istihdam talebini temsil eder.',false,1.1),
  ('51000000-0000-0000-0000-000000000007','10000000-0000-0000-0000-000000000003','Konut Başlangıçları ve İnşaat İzinleri','HOUSING_STARTS_PERMITS','REAL_ECON_MANUAL','Konut dongusunun oncu safhasini temsil eden baslangic ve izin bilesik gostergesidir.',false,1.2),
  ('51000000-0000-0000-0000-000000000008','10000000-0000-0000-0000-000000000004','Truflation','TRUFLATION_INDEX','INFLATION_MANUAL','Gercek zamanli fiyat akislarindan turetilen alternatif enflasyon gostergesidir.',true,1.2),
  ('51000000-0000-0000-0000-000000000009','10000000-0000-0000-0000-000000000004','Birim İşgücü Maliyeti','UNIT_LABOR_COSTS','INFLATION_MANUAL','Ucret baskisinin sirket maliyetine donusumunu temsil eder.',true,1.3),
  ('51000000-0000-0000-0000-000000000010','10000000-0000-0000-0000-000000000004','Atlanta Fed İş Değiştirenler vs. İşinde Kalanlar Ücret Farkı','ATLANTA_WAGE_SWITCHER_STAYER_GAP','INFLATION_MANUAL','Is degistirenlerle yerinde kalanlarin ucret farkini temsil eden ucret sarmali gostergesidir.',true,1.2),
  ('51000000-0000-0000-0000-000000000011','10000000-0000-0000-0000-000000000005','Küresel Yarı İletken Stok / Satış Oranı','GLOBAL_SEMI_STOCK_SALES_RATIO','GLOBAL_RISK_MANUAL','Yari iletken tedarik zincirinde stok siskinligi veya arz sikiligini temsil eder.',true,1.1),
  ('51000000-0000-0000-0000-000000000012','30000000-0000-0000-0000-000000000001','Beyin Göçü Endeksi','BRAIN_DRAIN_INDEX','SOCIAL_MANUAL','Nitelikli isgucu kaybinin hizini ve insan sermayesi asinmasini temsil eder.',true,1.2),
  ('51000000-0000-0000-0000-000000000013','30000000-0000-0000-0000-000000000001','Orta Sınıf Borç / Servet Oranı','MIDDLE_CLASS_DEBT_WEALTH_RATIO','SOCIAL_MANUAL','Orta sinifin borc yukunun servete gore baskisini temsil eder.',true,1.2),
  ('51000000-0000-0000-0000-000000000014','30000000-0000-0000-0000-000000000001','Hanehalkı Net Servet Değişimi (Reel)','REAL_HOUSEHOLD_NET_WORTH_CHANGE','SOCIAL_MANUAL','Enflasyondan arindirilmis net servet degisimini temsil eden refah gostergesidir.',false,1.2),
  ('51000000-0000-0000-0000-000000000015','30000000-0000-0000-0000-000000000002','GPU Kiralama Fiyatları','GPU_RENTAL_PRICE_INDEX','TECH_MANUAL','AI egitim ve inference kapasitesi icin GPU kiralama maliyetini temsil eder.',true,1.2),
  ('51000000-0000-0000-0000-000000000016','30000000-0000-0000-0000-000000000002','HBM Birim Fiyatları','HBM_PRICE_INDEX','TECH_MANUAL','Yuksek bant genislikli bellek maliyetinin AI altyapi baskisini temsil eder.',true,1.1),
  ('51000000-0000-0000-0000-000000000017','30000000-0000-0000-0000-000000000002','Yazılım Geliştirici Verimlilik Endeksi','AI_DEV_PRODUCTIVITY_INDEX','TECH_MANUAL','AI destekli kod uretiminin yazilim ekiplerindeki verimlilik etkisini temsil eder.',false,1.1),
  ('51000000-0000-0000-0000-000000000018','30000000-0000-0000-0000-000000000002','Kuantum Bilişim Patent Hızı','QUANTUM_PATENT_VELOCITY','TECH_MANUAL','Kuantum teknolojilerindeki fikri mulkiyet ivmesini temsil eder.',false,1.0),
  ('51000000-0000-0000-0000-000000000019','30000000-0000-0000-0000-000000000003','Fed Rezerv Karşılığı Faiz vs. Piyasa Arbitrajı','IORB_MARKET_ARBITRAGE','FED_MANUAL','IORB ile piyasa faizleri arasindaki arbitraj baskisini temsil eder.',true,1.2),
  ('51000000-0000-0000-0000-000000000020','30000000-0000-0000-0000-000000000003','Beige Book Belirsizlik Kelime Frekansı','BEIGE_BOOK_UNCERTAINTY_FREQ','FED_MANUAL','Beige Book metinlerinde belirsizlik tonunun yogunlugunu temsil eder.',true,1.0),
  ('51000000-0000-0000-0000-000000000021','30000000-0000-0000-0000-000000000004','VIX Opsiyon Hacmi / S&P 500 Opsiyon Hacmi Rasyosu','VIX_OPTION_SPX_OPTION_RATIO','ETF_MANUAL','Korunma talebinin hisse opsiyon hacmine gore ne kadar agir bastigini temsil eder.',true,1.1),
  ('51000000-0000-0000-0000-000000000022','30000000-0000-0000-0000-000000000005','Şanghay vs. Londra Altın Fiyat Primi','SHANGHAI_LONDON_GOLD_PREMIUM','PRECIOUS_MANUAL','Asya fiziki altin talebinin Londra referansina gore tasidigi primi temsil eder.',false,1.1),
  ('51000000-0000-0000-0000-000000000023','30000000-0000-0000-0000-000000000005','Hindistan Altın İthalat Hacmi','INDIA_GOLD_IMPORT_VOLUME','PRECIOUS_MANUAL','Hindistan kaynakli fiziki altin talep hacmini temsil eder.',false,1.0),
  ('51000000-0000-0000-0000-000000000024','30000000-0000-0000-0000-000000000006','Böcek İlacı ve Tarım İlacı Fiyat Endeksi','PESTICIDE_AGROCHEM_PRICE_INDEX','AGRI_MANUAL','Tarimsal kimyasal girdi maliyetini temsil eder.',true,1.0),
  ('51000000-0000-0000-0000-000000000025','30000000-0000-0000-0000-000000000007','Lityum Karbonat Spot Fiyatı','LITHIUM_CARBONATE_SPOT','ENERGY_MANUAL','Batarya zinciri ve yeni nesil enerji depolama maliyetini temsil eder.',true,1.0),
  ('51000000-0000-0000-0000-000000000026','30000000-0000-0000-0000-000000000011','Bitcoin Realized Cap','BTC_REALIZED_CAP','CRYPTO_API','Bitcoin aginda gerceklesen maliyet bazli sermaye birikimini temsil eder.',false,1.2),
  ('51000000-0000-0000-0000-000000000027','30000000-0000-0000-0000-000000000011','Layer 2 TVL Büyüme Hızı','L2_TVL_GROWTH_RATE','CRYPTO_API','Katman-2 ekosistemindeki kilitli varlik buyume hizini temsil eder.',false,1.0),
  ('51000000-0000-0000-0000-000000000028','30000000-0000-0000-0000-000000000011','Aktif Cüzdan Sayısı / İşlem Hacmi Oranı','ACTIVE_WALLETS_VOLUME_RATIO','CRYPTO_API','Ag etkinligi ile islem hacmi arasindaki saglik oranini temsil eder.',false,1.0),
  ('51000000-0000-0000-0000-000000000029','30000000-0000-0000-0000-000000000011','Bitcoin Madenci Geliri / Hashrate Rasyosu','MINER_REVENUE_HASHRATE_RATIO','CRYPTO_API','Madenci gelirinin hash gucune gore verimliligini temsil eder.',false,1.0)
ON CONFLICT (symbol) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  description = EXCLUDED.description,
  is_inverse = EXCLUDED.is_inverse,
  weight = EXCLUDED.weight;

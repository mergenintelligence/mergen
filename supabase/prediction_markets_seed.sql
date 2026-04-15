-- Prediction markets category seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO categories (id, name, description, weight)
VALUES
  (
    '30000000-0000-0000-0000-000000000012',
    'Polymarket / Kalshi Tahmin Piyasaları',
    'Tahmin piyasalarında fiyatlanan makro, politika ve jeopolitik beklenti rejimi',
    0.12
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  weight = EXCLUDED.weight;

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  -- ── Piyasa Yapısı & Aktivite ──────────────────────────────────────────────
  ('52000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000012','Toplam Açık Pozisyon','PM_TOTAL_OPEN_INTEREST','PREDICTION_MANUAL','Prediction market ekosisteminde açık kontrat büyüklüğünü temsil eder.',false,1.4),
  ('52000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000012','24s Hacim','PM_VOLUME_24H','PREDICTION_MANUAL','Son 24 saatteki işlem hacmini temsil eder.',false,1.2),
  ('52000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000012','7g Hacim','PM_VOLUME_7D','PREDICTION_MANUAL','Son 7 gündeki toplam işlem hacmini temsil eder.',false,1.2),
  ('52000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000012','Aktif Piyasa Sayısı','PM_ACTIVE_MARKET_COUNT','PREDICTION_MANUAL','İşlem gören aktif market sayısını temsil eder.',false,1.0),
  ('52000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000012','Makro Piyasa Sayısı','PM_MACRO_MARKET_COUNT','PREDICTION_MANUAL','Makro ve ekonomi temalı aktif market yoğunluğunu temsil eder.',false,1.0),
  ('52000000-0000-0000-0000-000000000006','30000000-0000-0000-0000-000000000012','Ort. Bid-Ask Spread','PM_AVG_BID_ASK_SPREAD','PREDICTION_MANUAL','Likidite kalitesini gösteren ortalama spread düzeyini temsil eder.',true,1.1),
  ('52000000-0000-0000-0000-000000000007','30000000-0000-0000-0000-000000000012','Ort. Piyasa Derinliği','PM_AVG_MARKET_DEPTH','PREDICTION_MANUAL','Fiyatlama derinliğini ve emir karşılanabilirliğini temsil eder.',false,1.1),

  -- ── Konsensüs Kalitesi ────────────────────────────────────────────────────
  ('52000000-0000-0000-0000-000000000008','30000000-0000-0000-0000-000000000012','Konsensüs Gücü','PM_CONSENSUS_STRENGTH','PREDICTION_MANUAL','Beklenti piyasasında fiyatların ne kadar net bir merkezde toplandığını temsil eder.',false,1.2),
  ('52000000-0000-0000-0000-000000000009','30000000-0000-0000-0000-000000000012','Belirsizlik Yoğunluğu','PM_UNCERTAINTY_DENSITY','PREDICTION_MANUAL','Kararsız ve parçalı fiyatlamanın yoğunluğunu temsil eder.',true,1.2),
  ('52000000-0000-0000-0000-000000000010','30000000-0000-0000-0000-000000000012','Piyasa Güven Skoru','PM_MARKET_CONFIDENCE_SCORE','PREDICTION_MANUAL','Likidite ve konsensüsün birlikte okunduğu güven skorunu temsil eder.',false,1.2),

  -- ── Parasal Politika & Fed ────────────────────────────────────────────────
  ('52000000-0000-0000-0000-000000000011','30000000-0000-0000-0000-000000000012','Fed Faiz İndirimi Olasılığı','PM_FED_CUT_PROB','PREDICTION_MANUAL','Fedin yakın vadede faiz indirimi yapma olasılığını temsil eder.',false,1.3),
  ('52000000-0000-0000-0000-000000000012','30000000-0000-0000-0000-000000000012','Yıl Sonu Fed Patika Beklentisi','PM_YEAR_END_FED_PATH','PREDICTION_MANUAL','Yıl sonu politika faizi patikasının prediction market fiyatlamasını temsil eder.',false,1.3),
  ('52000000-0000-0000-0000-000000000013','30000000-0000-0000-0000-000000000012','ABD Enflasyon Yukarı Sürpriz Olasılığı','PM_US_INFLATION_UPSURPRISE_PROB','PREDICTION_MANUAL','ABD enflasyon verisinin yukarı sürpriz yapma olasılığını temsil eder.',true,1.2),
  ('52000000-0000-0000-0000-000000000026','30000000-0000-0000-0000-000000000012','Faiz Artırım Olasılığı','PM_RATE_HIKE_PROB','PREDICTION_MANUAL','Fedin önümüzdeki toplantılarda faiz artırımına gitme olasılığını temsil eder.',true,1.2),
  ('52000000-0000-0000-0000-000000000027','30000000-0000-0000-0000-000000000012','Powell Güvercin Dönüşü Olasılığı','PM_POWELL_DOVISH_PIVOT_PROB','PREDICTION_MANUAL','Fed Başkanı Powell''ın açıkça gevşeme sinyali vermesi olasılığını temsil eder.',false,1.1),
  ('52000000-0000-0000-0000-000000000028','30000000-0000-0000-0000-000000000012','Fed Duraklama Uzama Olasılığı','PM_FED_PAUSE_EXTENSION_PROB','PREDICTION_MANUAL','Mevcut faiz seviyesinin daha uzun süre sabit kalma olasılığını temsil eder.',false,1.1),
  ('52000000-0000-0000-0000-000000000029','30000000-0000-0000-0000-000000000012','Stagflasyon Fiyatlama Olasılığı','PM_STAGFLATION_PROB','PREDICTION_MANUAL','Yüksek enflasyon ile zayıf büyümenin eş zamanlı fiyatlanma olasılığını temsil eder.',true,1.3),
  ('52000000-0000-0000-0000-000000000030','30000000-0000-0000-0000-000000000012','Enflasyon Hedef Aşımı Olasılığı','PM_INFLATION_TARGET_BREACH_PROB','PREDICTION_MANUAL','CPI''nın %3 üzerinde kalıcı olarak seyretme olasılığını temsil eder.',true,1.2),

  -- ── Büyüme & Resesyon ─────────────────────────────────────────────────────
  ('52000000-0000-0000-0000-000000000014','30000000-0000-0000-0000-000000000012','ABD Resesyon Olasılığı','PM_US_RECESSION_PROB','PREDICTION_MANUAL','ABD ekonomisi için resesyon fiyatlamasını temsil eder.',true,1.3),
  ('52000000-0000-0000-0000-000000000015','30000000-0000-0000-0000-000000000012','Yumuşak İniş Olasılığı','PM_SOFT_LANDING_PROB','PREDICTION_MANUAL','Büyümenin sert bozulmadan yavaşlamasına yönelik iyimser fiyatlamayı temsil eder.',false,1.2),
  ('52000000-0000-0000-0000-000000000031','30000000-0000-0000-0000-000000000012','AB Resesyon Olasılığı','PM_EU_RECESSION_PROB','PREDICTION_MANUAL','Avro Bölgesi ekonomisi için resesyon fiyatlamasını temsil eder.',true,1.1),
  ('52000000-0000-0000-0000-000000000032','30000000-0000-0000-0000-000000000012','Çin Sert İniş Olasılığı','PM_CHINA_HARD_LANDING_PROB','PREDICTION_MANUAL','Çin büyümesinin belirgin biçimde yavaşlama olasılığını temsil eder; EM etkisi kritik.',true,1.1),
  ('52000000-0000-0000-0000-000000000033','30000000-0000-0000-0000-000000000012','Gelişmekte Olan Piyasa Bulaşma Olasılığı','PM_EM_CONTAGION_PROB','PREDICTION_MANUAL','EM döviz ve borç piyasalarındaki stres yayılımı olasılığını temsil eder.',true,1.1),
  ('52000000-0000-0000-0000-000000000034','30000000-0000-0000-0000-000000000012','OECD Büyüme Aşağı Revizyon Olasılığı','PM_OECD_GROWTH_DOWNGRADE_PROB','PREDICTION_MANUAL','Küresel büyüme beklentilerinin aşağı revize edilme olasılığını temsil eder.',true,1.0),

  -- ── Küresel Risk & Jeopolitik ─────────────────────────────────────────────
  ('52000000-0000-0000-0000-000000000018','30000000-0000-0000-0000-000000000012','Büyük Savaş / Çatışma Tırmanma Olasılığı','PM_WAR_ESCALATION_PROB','PREDICTION_MANUAL','Jeopolitik çatışmanın genişleyici biçimde tırmanma olasılığını temsil eder.',true,1.1),
  ('52000000-0000-0000-0000-000000000017','30000000-0000-0000-0000-000000000012','Petrol Şok Olasılığı','PM_OIL_SHOCK_PROB','PREDICTION_MANUAL','Enerji kaynaklı ani fiyat şoku olasılığını temsil eder.',true,1.1),
  ('52000000-0000-0000-0000-000000000019','30000000-0000-0000-0000-000000000012','Borç Tavanı / Bütçe Krizi Olasılığı','PM_DEBT_CEILING_CRISIS_PROB','PREDICTION_MANUAL','ABD bütçe ve borç tavanı kaynaklı siyasi-mali kriz fiyatlamasını temsil eder.',true,1.1),
  ('52000000-0000-0000-0000-000000000016','30000000-0000-0000-0000-000000000012','Kredi Spread Açılması Olasılığı','PM_CREDIT_SPREAD_WIDENING_PROB','PREDICTION_MANUAL','Kredi piyasasında spread açılması ve risk priminin yükselmesi olasılığını temsil eder.',true,1.1),
  ('52000000-0000-0000-0000-000000000035','30000000-0000-0000-0000-000000000012','Ticaret Savaşı Tırmanma Olasılığı','PM_TRADE_WAR_ESCALATION_PROB','PREDICTION_MANUAL','ABD-Çin başta olmak üzere küresel ticaret savaşlarının sertleşme olasılığını temsil eder.',true,1.2),
  ('52000000-0000-0000-0000-000000000036','30000000-0000-0000-0000-000000000012','Tarife Şoku Olasılığı','PM_TARIFF_SHOCK_PROB','PREDICTION_MANUAL','Ani ve geniş kapsamlı tarife artışlarının ekonomiye şok etkisi oluşturma olasılığını temsil eder.',true,1.1),

  -- ── Varlık Sınıfı Beklentileri ────────────────────────────────────────────
  ('52000000-0000-0000-0000-000000000037','30000000-0000-0000-0000-000000000012','BTC 100K Üzeri Olasılığı','PM_BTC_ABOVE_100K_PROB','PREDICTION_MANUAL','Bitcoin fiyatının 100.000 dolar üzerinde kalıcılaşma olasılığını temsil eder.',false,1.1),
  ('52000000-0000-0000-0000-000000000038','30000000-0000-0000-0000-000000000012','Altın 3000$ Üzeri Olasılığı','PM_GOLD_ABOVE_3000_PROB','PREDICTION_MANUAL','Altın fiyatının 3.000 dolar üzerinde kalma olasılığını temsil eder; güvenli liman talebinin yansıması.',false,1.1),
  ('52000000-0000-0000-0000-000000000039','30000000-0000-0000-0000-000000000012','Petrol 100$ Üzeri Olasılığı','PM_OIL_ABOVE_100_PROB','PREDICTION_MANUAL','WTI ham petrol fiyatının 100 dolar üzerine çıkma olasılığını temsil eder.',true,1.0),
  ('52000000-0000-0000-0000-000000000040','30000000-0000-0000-0000-000000000012','Dolar Güçlenme Olasılığı','PM_DOLLAR_STRENGTH_PROB','PREDICTION_MANUAL','DXY endeksinin yükselme trendine girmesi olasılığını temsil eder; risk iştahını baskılar.',true,1.1),
  ('52000000-0000-0000-0000-000000000041','30000000-0000-0000-0000-000000000012','Kripto Sıkı Regülasyon Olasılığı','PM_CRYPTO_REGULATION_STRICT_PROB','PREDICTION_MANUAL','ABD veya AB''nin kripto sektörüne sert regülasyon getirme olasılığını temsil eder.',true,1.0),
  ('52000000-0000-0000-0000-000000000042','30000000-0000-0000-0000-000000000012','Hisse Senedi Düzeltme Olasılığı','PM_EQUITY_CORRECTION_PROB','PREDICTION_MANUAL','Geniş endekslerde %15+ düzeltme olasılığını temsil eder; risk-off rejimi sinyali.',true,1.2),

  -- ── Rejim Skorları ────────────────────────────────────────────────────────
  ('52000000-0000-0000-0000-000000000020','30000000-0000-0000-0000-000000000012','Genel Beklenti Skoru','PM_GENERAL_SCORE','PREDICTION_MANUAL','Prediction market ekosisteminin genel makro rejim skorunu temsil eder.',false,1.5),
  ('52000000-0000-0000-0000-000000000021','30000000-0000-0000-0000-000000000012','Makro Risk Fiyatlama Skoru','PM_MACRO_RISK_SCORE','PREDICTION_MANUAL','Makro olayların ne kadar stresli fiyatlandığını temsil eder.',true,1.4),
  ('52000000-0000-0000-0000-000000000022','30000000-0000-0000-0000-000000000012','Resesyon Fiyatlama Skoru','PM_RECESSION_PRICING_SCORE','PREDICTION_MANUAL','Resesyon temasının piyasalarda ne kadar baskın fiyatlandığını temsil eder.',true,1.3),
  ('52000000-0000-0000-0000-000000000023','30000000-0000-0000-0000-000000000012','Enflasyon Baskısı Fiyatlama Skoru','PM_INFLATION_PRICING_SCORE','PREDICTION_MANUAL','Enflasyonist risklerin beklenti piyasasında ağırlığını temsil eder.',true,1.3),
  ('52000000-0000-0000-0000-000000000024','30000000-0000-0000-0000-000000000012','PM vs Tahvil Sapması','PM_VS_BONDS_DIVERGENCE','PREDICTION_MANUAL','Prediction market fiyatlaması ile tahvil piyasası rejimi arasındaki sapmayı temsil eder.',true,1.1),
  ('52000000-0000-0000-0000-000000000025','30000000-0000-0000-0000-000000000012','PM vs Altın Sapması','PM_VS_GOLD_DIVERGENCE','PREDICTION_MANUAL','Prediction market fiyatlaması ile altın güvenli liman fiyatlaması arasındaki sapmayı temsil eder.',true,1.0),
  ('52000000-0000-0000-0000-000000000043','30000000-0000-0000-0000-000000000012','Rejim Tutarlılık Skoru','PM_REGIME_COHERENCE_SCORE','PREDICTION_MANUAL','Farklı beklenti piyasası sinyallerinin birbiriyle ne kadar tutarlı bir anlatı oluşturduğunu temsil eder.',false,1.2),
  ('52000000-0000-0000-0000-000000000044','30000000-0000-0000-0000-000000000012','Sürpriz Risk Skoru','PM_SURPRISE_RISK_SCORE','PREDICTION_MANUAL','Konsensüs dışı bir gelişmenin piyasayı şaşırtma potansiyelini temsil eder.',true,1.1)

ON CONFLICT (symbol) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  description = EXCLUDED.description,
  is_inverse = EXCLUDED.is_inverse,
  weight = EXCLUDED.weight;

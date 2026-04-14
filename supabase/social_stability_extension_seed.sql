-- Social and political stability category extension seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  (
    '31000000-0000-0000-0000-000000000008',
    '30000000-0000-0000-0000-000000000001',
    'Misery Index (Sefalet Endeksi)',
    'MISERY_INDEX',
    'FRED_COMPOSITE',
    'Issizlik ve yillik tuketici enflasyonunun toplami; halkin uzerindeki ekonomik baskiyi olcer.',
    true,
    1.8
  ),
  (
    '31000000-0000-0000-0000-000000000009',
    '30000000-0000-0000-0000-000000000001',
    'Genç İşsizlik Oranı',
    'LNS14024887',
    'FRED',
    '16-24 yas issizlik orani; sosyal patlama ve beyin gocu icin erken uyaridir.',
    true,
    1.7
  ),
  (
    '31000000-0000-0000-0000-000000000010',
    '30000000-0000-0000-0000-000000000001',
    'Tüketici Güven Endeksi',
    'UMCSENT',
    'FRED',
    'Tuketici beklentileri ve siyasi destekteki kirilmayi onceden haber veren duyarlilik gostergesi.',
    false,
    1.5
  ),
  (
    '31000000-0000-0000-0000-000000000011',
    '30000000-0000-0000-0000-000000000001',
    'Reel Ücret Değişimi (Alt %25)',
    'REAL_WAGE_BOTTOM25',
    'SOCIAL_MANUAL',
    'Dar gelirli kesimde enflasyondan arindirilmis ucret degisimini olcer.',
    false,
    1.6
  ),
  (
    '31000000-0000-0000-0000-000000000012',
    '30000000-0000-0000-0000-000000000001',
    'Gini Katsayısı (Net Gelir)',
    'NET_INCOME_GINI',
    'SOCIAL_MANUAL',
    'Gelir adaletsizliginin net gelir bazli yaygin standart olcumu.',
    true,
    1.4
  ),
  (
    '31000000-0000-0000-0000-000000000013',
    '30000000-0000-0000-0000-000000000001',
    'Yolsuzluk Algı Endeksi',
    'CORRUPTION_PERCEPTIONS',
    'SOCIAL_MANUAL',
    'Kurumsal erozyon ve devlete guven kaybini temsil eden yolsuzluk algi skoru.',
    false,
    1.4
  ),
  (
    '31000000-0000-0000-0000-000000000014',
    '30000000-0000-0000-0000-000000000001',
    'Siyasi Kutuplaşma Endeksi',
    'POLITICAL_POLARIZATION',
    'SOCIAL_MANUAL',
    'Toplumun ideolojik olarak ne kadar sert ayrildigini ve uzlasma kapasitesinin asindigini olcer.',
    true,
    1.5
  ),
  (
    '31000000-0000-0000-0000-000000000015',
    '30000000-0000-0000-0000-000000000001',
    'Gıda Enflasyonu vs. Genel Enflasyon Farkı',
    'FOOD_HEADLINE_SPREAD',
    'FRED_COMPOSITE',
    'Gida fiyatlarinin genel enflasyondan ne kadar saptigini gostererek alt sinif baskisini olcer.',
    true,
    1.6
  ),
  (
    '31000000-0000-0000-0000-000000000016',
    '30000000-0000-0000-0000-000000000001',
    'Konut Fiyatı / Medyan Gelir Oranı',
    'HOUSING_TO_INCOME',
    'SOCIAL_MANUAL',
    'Nesiller arasi adaletsizligi ve konut erisilebilirligini olcer.',
    true,
    1.5
  ),
  (
    '31000000-0000-0000-0000-000000000017',
    '30000000-0000-0000-0000-000000000001',
    'Sosyal Hareketlilik Endeksi',
    'SOCIAL_MOBILITY_INDEX',
    'SOCIAL_MANUAL',
    'Alt siniftan ust sinifa cikis ihtimalini ve liyakat algisini olcer.',
    false,
    1.4
  ),
  (
    '31000000-0000-0000-0000-000000000018',
    '30000000-0000-0000-0000-000000000001',
    'Yargı Bağımsızlığı ve Hukukun Üstünlüğü',
    'RULE_OF_LAW_SCORE',
    'SOCIAL_MANUAL',
    'Mulkiyet haklari, sozlesme guvencesi ve hukuk sistemine olan guveni temsil eder.',
    false,
    1.5
  ),
  (
    '31000000-0000-0000-0000-000000000019',
    '30000000-0000-0000-0000-000000000001',
    'Basın ve İfade Özgürlüğü Endeksi',
    'PRESS_FREEDOM_SCORE',
    'SOCIAL_MANUAL',
    'Bilgi akisinin ne kadar serbest oldugunu ve toplumsal basinç valfinin acikligini gosterir.',
    false,
    1.3
  ),
  (
    '31000000-0000-0000-0000-000000000020',
    '30000000-0000-0000-0000-000000000001',
    'Kamu Hizmetlerine Erişim ve Kalite Algısı',
    'PUBLIC_SERVICES_SENTIMENT',
    'SOCIAL_MANUAL',
    'Saglik, egitim ve ulasim gibi hizmetlerde orta sinif memnuniyetini olcer.',
    false,
    1.2
  ),
  (
    '31000000-0000-0000-0000-000000000021',
    '30000000-0000-0000-0000-000000000001',
    'Mülteci / Göçmen Yoğunluğu ve Sosyal Uyum',
    'MIGRANT_INTEGRATION_STRESS',
    'SOCIAL_MANUAL',
    'Gocmen yogunlugu ve kamu kapasitesi baskisi uzerinden sosyal uyum riskini temsil eder.',
    true,
    1.3
  ),
  (
    '31000000-0000-0000-0000-000000000022',
    '30000000-0000-0000-0000-000000000001',
    'Sivil Toplum Gücü ve Örgütlenme Özgürlüğü',
    'CIVIL_SOCIETY_STRENGTH',
    'SOCIAL_MANUAL',
    'STKlarin ve meslek orgutlerinin karar alma surecine etkisini temsil eder.',
    false,
    1.2
  ),
  (
    '31000000-0000-0000-0000-000000000023',
    '30000000-0000-0000-0000-000000000001',
    'Eğitimli İşsizlik ve Elite Overproduction',
    'ELITE_OVERPRODUCTION',
    'SOCIAL_MANUAL',
    'Egitimli issizlik ve beklentisi yuksek ama tatminsiz kitlenin buyuklugunu temsil eder.',
    true,
    1.4
  )
ON CONFLICT (symbol) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  description = EXCLUDED.description,
  is_inverse = EXCLUDED.is_inverse,
  weight = EXCLUDED.weight;

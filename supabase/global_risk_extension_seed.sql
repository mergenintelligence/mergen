-- Global risks category extension seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  (
    '20000000-0000-0000-0000-000000000045',
    '10000000-0000-0000-0000-000000000005',
    'Geopolitical Risk (GPR) Index',
    'GPR_INDEX',
    'GLOBAL_RISK_MANUAL',
    'Caldara-Iacoviello haber tabanli jeopolitik stres endeksi; savas ve teror kaynakli ani risk spike''larini izler.',
    true,
    1.8
  ),
  (
    '20000000-0000-0000-0000-000000000046',
    '10000000-0000-0000-0000-000000000005',
    'Bakır/Altın Oranı',
    'COPPER_GOLD_RATIO',
    'FRED_COMPOSITE',
    'Bakirin buyume, altinin korku sinyali tasidigi kuresel risk istahi orani.',
    false,
    1.7
  ),
  (
    '20000000-0000-0000-0000-000000000047',
    '10000000-0000-0000-0000-000000000005',
    'VXEEM',
    'VXEEM_INDEX',
    'GLOBAL_RISK_MANUAL',
    'Gelismekte olan piyasalar volatilite endeksi; kuresel riskin cevre ulkelere ilk darbesini izler.',
    true,
    1.5
  ),
  (
    '20000000-0000-0000-0000-000000000048',
    '10000000-0000-0000-0000-000000000005',
    'Küresel Tedarik Zinciri Baskı Endeksi',
    'GSCPI_GLOBAL_RISK',
    'GLOBAL_RISK_MANUAL',
    'Nakliye, teslimat ve lojistik tikanmasini gostererek kuresel ticaretteki darboğazi olcer.',
    true,
    1.5
  ),
  (
    '20000000-0000-0000-0000-000000000049',
    '10000000-0000-0000-0000-000000000005',
    'Global Economic Policy Uncertainty',
    'GEPU_GLOBAL',
    'GLOBAL_RISK_MANUAL',
    'Hukumetlerin ekonomi politikalarindaki kararsizlik ve ticaret savasi riskini olcer.',
    true,
    1.4
  ),
  (
    '20000000-0000-0000-0000-000000000050',
    '10000000-0000-0000-0000-000000000005',
    'Baltık Kuru Yük Endeksi',
    'BDI_GLOBAL',
    'GLOBAL_RISK_MANUAL',
    'Hammadde tasimaciligi maliyeti uzerinden reel ticaret ve sanayi talebinin nabzini gosterir.',
    false,
    1.4
  ),
  (
    '20000000-0000-0000-0000-000000000051',
    '10000000-0000-0000-0000-000000000005',
    'CBOE Skew Index',
    'SKEW_BLACK_SWAN',
    'GLOBAL_RISK_MANUAL',
    'Opsiyon piyasasindaki kuyruk riski ve siyah kugu sigortalama talebini gosterir.',
    true,
    1.5
  ),
  (
    '20000000-0000-0000-0000-000000000052',
    '10000000-0000-0000-0000-000000000005',
    'J.P. Morgan EMBI Global Spread',
    'JPM_EMBI_GLOBAL_SPREAD',
    'GLOBAL_RISK_MANUAL',
    'Gelismekte olan ulke dolar tahvilleri ile ABD hazineleri arasindaki spread; sermaye kacisi riskini gosterir.',
    true,
    1.6
  ),
  (
    '20000000-0000-0000-0000-000000000053',
    '10000000-0000-0000-0000-000000000005',
    'Drewry World Container Index',
    'WCI_DREWRY',
    'GLOBAL_RISK_MANUAL',
    'Bitmis urun konteyner navlun maliyetleri uzerinden tedarik zinciri tikanmasini gosterir.',
    true,
    1.3
  ),
  (
    '20000000-0000-0000-0000-000000000054',
    '10000000-0000-0000-0000-000000000005',
    'Cyber Threat Level',
    'CYBER_THREAT_LEVEL',
    'GLOBAL_RISK_MANUAL',
    'Kuresel capta aktif siber saldiri yogunlugunu temsil eden hibrit savas riski gostergesi.',
    true,
    1.2
  ),
  (
    '20000000-0000-0000-0000-000000000055',
    '10000000-0000-0000-0000-000000000005',
    'Küresel Gıda Fiyat Oynaklığı',
    'GLOBAL_FOOD_VOLATILITY',
    'GLOBAL_RISK_MANUAL',
    'Temel gida maddelerindeki oynakligin sosyal huzursuzluk ve goc riski yaratma gucunu olcer.',
    true,
    1.2
  ),
  (
    '20000000-0000-0000-0000-000000000056',
    '10000000-0000-0000-0000-000000000005',
    'Tanker Navlun Endeksi',
    'TANKER_FREIGHT_INDEX',
    'GLOBAL_RISK_MANUAL',
    'Ham petrol ve rafine urun tasimaciligi uzerinden enerji arz guvenligi ve bogaz riski sinyali verir.',
    true,
    1.2
  ),
  (
    '20000000-0000-0000-0000-000000000057',
    '10000000-0000-0000-0000-000000000005',
    'Döviz Rezervi Aşınma Hızı',
    'RESERVE_DEPLETION_VELOCITY',
    'GLOBAL_RISK_MANUAL',
    'Gelismekte olan merkez bankalarinin toplam rezerv erimesi uzerinden odemeler dengesi baskisini izler.',
    true,
    1.3
  ),
  (
    '20000000-0000-0000-0000-000000000058',
    '10000000-0000-0000-0000-000000000005',
    'Kritik Mineral Arz Riski Endeksi',
    'CRITICAL_MINERAL_SUPPLY_RISK',
    'GLOBAL_RISK_MANUAL',
    'Lityum, kobalt ve nadir toprak elementlerinde arz-talep ve ambargo kaynakli yapisal teknoloji riskini izler.',
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

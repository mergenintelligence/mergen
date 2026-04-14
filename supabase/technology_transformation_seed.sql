-- Technology and structural transformation category seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO categories (id, name, description, weight)
VALUES (
  '30000000-0000-0000-0000-000000000002',
  'Teknoloji ve Yapısal Dönüşüm',
  'Yapay zeka, yarı iletkenler, altyapi talebi ve stratejik teknoloji yogunlasmasi uzerinden yapisal donusumu izler.',
  0.15
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  weight = EXCLUDED.weight;

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  (
    '32000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000002',
    'Mag Seven Index',
    'MAGS',
    'YAHOO',
    'Magnificent Seven temasını temsil eden piyasa bazlı teknoloji yoğunlaşma göstergesi.',
    false,
    2.0
  ),
  (
    '32000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000002',
    'iShares IGV',
    'IGV',
    'YAHOO',
    'BlackRock iShares çatısı altındaki bu ETF, geniş yazılım ve uygulama ekosisteminin genel sağlığını temsil eder.',
    false,
    1.5
  ),
  (
    '32000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000002',
    'Bitcoin',
    'BTC',
    'YAHOO',
    'Dijital rezerv varlik ve risk istahi/teknoloji anlatisi kesismesinde izlenen gostergedir.',
    false,
    1.5
  ),
  (
    '32000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000002',
    'VanEck Semiconductor ETF',
    'SMH',
    'YAHOO',
    'Yari iletken uretim zinciri ve chip sermaye dongusunu temsil eden gosterge.',
    false,
    2.0
  ),
  (
    '32000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000002',
    'Nasdaq 100',
    'QQQ',
    'YAHOO',
    'Genis buyuk teknoloji ve buyume hissesi risk istahini temsil eden gosterge.',
    false,
    1.5
  ),
  (
    '32000000-0000-0000-0000-000000000006',
    '30000000-0000-0000-0000-000000000002',
    'Copper Futures',
    'HG=F',
    'YAHOO',
    'Elektrifikasyon, veri merkezi ve altyapi yogunlugu icin fiziksel girdi gostergesi.',
    false,
    1.0
  ),
  (
    '32000000-0000-0000-0000-000000000007',
    '30000000-0000-0000-0000-000000000002',
    'TSMC',
    'TSM',
    'YAHOO',
    'Gelişmis foundry kapasitesi ve uretim konsantrasyonu riskini temsil eden gosterge.',
    false,
    1.5
  ),
  (
    '32000000-0000-0000-0000-000000000008',
    '30000000-0000-0000-0000-000000000002',
    'Hyperscaler AI Capex',
    'AI_CAPEX_HYPERSCALERS',
    'HYPERSCALER_CAPEX',
    'Microsoft, Alphabet, Meta ve Amazon toplam teknoloji yatirimi / AI capex hizi.',
    false,
    2.0
  ),
  (
    '32000000-0000-0000-0000-000000000009',
    '30000000-0000-0000-0000-000000000002',
    'Data Center Elektrik Talebi',
    'IEA_DC_POWER_DEMAND',
    'IEA',
    'Veri merkezi ve AI yuklerinin elektrik ihtiyaci kaynakli fiziksel baski gostergesi.',
    true,
    1.5
  ),
  (
    '32000000-0000-0000-0000-000000000010',
    '30000000-0000-0000-0000-000000000002',
    'TSMC Advanced Node Share',
    'TSMC_ADV_NODE_SHARE',
    'TSMC_STRUCTURAL',
    'Ileri chip uretiminde TSMC payi ve uretim yogunlasma riski.',
    true,
    2.0
  ),
  (
    '32000000-0000-0000-0000-000000000011',
    '30000000-0000-0000-0000-000000000002',
    'Global X Lithium & Battery Tech ETF',
    'LIT',
    'YAHOO',
    'Lityum ve batarya deger zinciri icin piyasa proxy gostergesi.',
    false,
    1.0
  ),
  (
    '32000000-0000-0000-0000-000000000012',
    '30000000-0000-0000-0000-000000000002',
    'Strategic Value Index',
    'STRATEGIC_VALUE_INDEX',
    'STRATEGIC_VALUE',
    'Bir teknoloji alaninin ABD ulusal guvenligi ve sanayi politikasi acisindan stratejik onemini izleyen gostergedir.',
    false,
    1.0
  ),
  (
    '32000000-0000-0000-0000-000000000013',
    '30000000-0000-0000-0000-000000000002',
    'Global X Cloud Computing ETF',
    'CLOU',
    'YAHOO',
    'Bulut altyapisi ve cloud yazilim ekosisteminin genisligini temsil eden gosterge.',
    false,
    1.0
  ),
  (
    '32000000-0000-0000-0000-000000000014',
    '30000000-0000-0000-0000-000000000002',
    'First Trust NASDAQ Cybersecurity ETF',
    'CIBR',
    'YAHOO',
    'Siber guvenlik altyapisi ve savunma yazilimi talebini temsil eden gosterge.',
    false,
    1.0
  ),
  (
    '32000000-0000-0000-0000-000000000015',
    '30000000-0000-0000-0000-000000000002',
    'ARK Innovation ETF',
    'ARKK',
    'YAHOO',
    'Yuksek beta yenilik ve spekulatif teknoloji sermaye istahini temsil eden gosterge.',
    false,
    1.0
  ),
  (
    '32000000-0000-0000-0000-000000000016',
    '30000000-0000-0000-0000-000000000002',
    'NVIDIA',
    'NVDA',
    'YAHOO',
    'AI hesaplama omurgasi ve hizlandirici talebinin cekirdek sirket gostergesi.',
    false,
    2.0
  ),
  (
    '32000000-0000-0000-0000-000000000017',
    '30000000-0000-0000-0000-000000000002',
    'Global X Uranium ETF',
    'URA',
    'YAHOO',
    'Elektrik yogun veri merkezi ve baz yuk enerji anlatisi icin uranyum/enerji proxy gostergesi.',
    false,
    1.0
  ),
  (
    '32000000-0000-0000-0000-000000000018',
    '30000000-0000-0000-0000-000000000002',
    'Equinix',
    'EQIX',
    'YAHOO',
    'Veri merkezi altyapisi ve fiziksel dijital omurga yatirimini temsil eden gosterge.',
    false,
    1.5
  ),
  (
    '32000000-0000-0000-0000-000000000019',
    '30000000-0000-0000-0000-000000000002',
    'Palantir',
    'PLTR',
    'YAHOO',
    'Devlet teknolojisi, savunma yazilimi ve veri platformu anlatilarinin kesisimindeki gosterge.',
    false,
    1.0
  )
ON CONFLICT (symbol) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  description = EXCLUDED.description,
  is_inverse = EXCLUDED.is_inverse,
  weight = EXCLUDED.weight;

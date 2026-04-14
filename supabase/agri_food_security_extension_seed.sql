-- Agriculture and food security category extension seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  (
    '36000000-0000-0000-0000-000000000007',
    '30000000-0000-0000-0000-000000000006',
    'FAO Gıda Fiyat Endeksi',
    'FAO_FOOD_PRICE_INDEX',
    'AGRI_MANUAL',
    'Kuresel gida sepetindeki aylik fiyat baskisini temsil eden ana gosterge.',
    true,
    1.6
  ),
  (
    '36000000-0000-0000-0000-000000000008',
    '30000000-0000-0000-0000-000000000006',
    'Stok/Kullanım Oranı',
    'STOCKS_TO_USE_RATIO',
    'AGRI_MANUAL',
    'Baslica tarimsal urunlerde mevcut stoklarin tuketime oranini temsil eder.',
    false,
    1.4
  ),
  (
    '36000000-0000-0000-0000-000000000009',
    '30000000-0000-0000-0000-000000000006',
    'Gübre Fiyat Endeksi',
    'FERTILIZER_PRICE_INDEX',
    'AGRI_MANUAL',
    'Tarimsal girdi maliyetlerinin cekirdek gostergesi olan gubre fiyat baskisini temsil eder.',
    true,
    1.3
  ),
  (
    '36000000-0000-0000-0000-000000000010',
    '30000000-0000-0000-0000-000000000006',
    'USDA WASDE Revizyon Endeksi',
    'WASDE_REVISION_INDEX',
    'AGRI_MANUAL',
    'USDA arz-talep tahminlerindeki rekolte revizyonlarinin net yonunu temsil eder.',
    true,
    1.3
  ),
  (
    '36000000-0000-0000-0000-000000000011',
    '30000000-0000-0000-0000-000000000006',
    'US Drought Monitor',
    'US_DROUGHT_MONITOR',
    'AGRI_MANUAL',
    'Ana tarim bolgelerindeki siddetli kuraklik yogunlugunu temsil eder.',
    true,
    1.4
  ),
  (
    '36000000-0000-0000-0000-000000000012',
    '30000000-0000-0000-0000-000000000006',
    'Enerji-Tarım Oranı',
    'ENERGY_AGRI_RATIO',
    'FRED_COMPOSITE',
    'Petrol ile tarim sepeti arasindaki girdi ve biyo-yakit baglantisini temsil eden oran.',
    true,
    1.2
  ),
  (
    '36000000-0000-0000-0000-000000000013',
    '30000000-0000-0000-0000-000000000006',
    'Baltık Kuru Yük Endeksi - Tarım Bileşeni',
    'AGRI_BDI_COMPONENT',
    'AGRI_MANUAL',
    'Kuresel tahil ve tarim urunleri nakliye maliyetini temsil eder.',
    true,
    1.1
  )
ON CONFLICT (symbol) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  description = EXCLUDED.description,
  is_inverse = EXCLUDED.is_inverse,
  weight = EXCLUDED.weight;

-- Agriculture commodities and food security category seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO categories (id, name, description, weight)
VALUES (
  '30000000-0000-0000-0000-000000000006',
  'Tarımsal Emtia ve Gıda Güvenliği',
  'Tahil, seker, kahve ve genis tarim sepeti uzerinden gida enflasyonu, arz kirilganligi ve tarimsal stres rejimini izler.',
  0.10
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  weight = EXCLUDED.weight;

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  (
    '36000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000006',
    'Teucrium Wheat Fund',
    'WEAT',
    'YAHOO',
    'Bugday fiyat ve arz stresi icin tarimsal temel tahil gostergesi.',
    true,
    1.5
  ),
  (
    '36000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000006',
    'Teucrium Corn Fund',
    'CORN',
    'YAHOO',
    'Misir fiyat ve yem/enerji baglantili tarimsal baski gostergesi.',
    true,
    1.5
  ),
  (
    '36000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000006',
    'Teucrium Soybean Fund',
    'SOYB',
    'YAHOO',
    'Soya zinciri uzerinden protein, yem ve tarimsal ticaret baskisi gostergesi.',
    true,
    1.5
  ),
  (
    '36000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000006',
    'Invesco DB Agriculture Fund',
    'DBA',
    'YAHOO',
    'Genis tarimsal emtia sepeti ile gida tarafindaki yaygin fiyat baskisini temsil eder.',
    true,
    2.0
  ),
  (
    '36000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000006',
    'iPath Bloomberg Coffee Subindex ETN',
    'JO',
    'YAHOO',
    'Kahve uzerinden iklim hassasiyeti ve tropikal tarim arz kirilganligini temsil eder.',
    true,
    1.0
  ),
  (
    '36000000-0000-0000-0000-000000000006',
    '30000000-0000-0000-0000-000000000006',
    'Teucrium Sugar Fund',
    'CANE',
    'YAHOO',
    'Seker fiyatlari uzerinden gida zinciri ve tropikal arz stresi gostergesi.',
    true,
    1.0
  )
ON CONFLICT (symbol) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  description = EXCLUDED.description,
  is_inverse = EXCLUDED.is_inverse,
  weight = EXCLUDED.weight;

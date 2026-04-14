-- Energy and Energy Security category seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO categories (id, name, description, weight)
VALUES (
  '30000000-0000-0000-0000-000000000007',
  'Enerji ve Enerji Güvenliği',
  'Ham petrol, dogalgaz ve enerji enflasyonu uzerinden kuresel maliyet tabani, arz kirilganligi ve enerji guvenligini izler.',
  0.10
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  weight = EXCLUDED.weight;

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  (
    '37000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000007',
    'ICE Brent Crude Oil Futures',
    'BZ=F',
    'YAHOO',
    'Brent-WTI spread analizinin Brent ayagi; jeopolitik risk ve uluslararasi arz kirilganligini temsil eder.',
    true,
    2.0
  ),
  (
    '37000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000007',
    'Henry Hub Natural Gas Futures',
    'NG=F',
    'YAHOO',
    'ABD dogalgaz fiyati; TTF-Henry Hub makasinin temel gostergesi ve LNG sevkiyat dinamiklerinin proxy verisi.',
    true,
    1.5
  ),
  (
    '37000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000007',
    'United States Oil Fund ETF',
    'USO',
    'YAHOO',
    'WTI ham petrol ETF gostergesi; Brent ile birlikte enerji spread analizinde kullanilir.',
    true,
    1.5
  ),
  (
    '37000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000007',
    'ABD Stratejik Petrol Rezervi (SPR)',
    'WCSSTUS1',
    'FRED',
    'ABD stratejik petrol rezervi haftalik stok seviyesi (bin varil). Dusen rezerv gelecekteki zorla alim talebini ve fiyat tabanini isaret eder.',
    false,
    2.0
  ),
  (
    '37000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000007',
    'Enerji TÜFE Baskı Endeksi',
    'CPIENGSL',
    'FRED',
    'Enerji kalemlerinin genel TUFE icindeki fiyat degisimi. Enerji enflasyonunun kuresel maliyet tabanina geciskenligini olcer.',
    true,
    2.0
  ),
  (
    '37000000-0000-0000-0000-000000000006',
    '30000000-0000-0000-0000-000000000007',
    'United States Natural Gas Fund ETF',
    'UNG',
    'YAHOO',
    'ABD dogalgaz ETF; Avrupa TTF fiyati ile karsilastirmali gaz spread analizinde kullanilan proxy gosterge.',
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

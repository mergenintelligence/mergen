-- Pilot category seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO categories (id, name, description, weight)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  'Kredi ve Finansal Stres',
  'Kredi spreadleri, volatilite ve fonlama stresi uzerinden sistemik kirilganligi izler.',
  0.25
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  weight = EXCLUDED.weight;

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'HY Kredi Spreadi',
    'BAMLH0A0HYM2',
    'FRED',
    'US High Yield option-adjusted spread.',
    true,
    2.0
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'MOVE Endeksi',
    'MOVE',
    'YAHOO',
    'US Treasury implied volatility proxy.',
    true,
    2.0
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'VIX',
    'VIXCLS',
    'FRED',
    'CBOE Volatility Index.',
    true,
    1.5
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    'Banka Rezervleri',
    'WRESBAL',
    'FRED',
    'Reserve balances held at Federal Reserve Banks.',
    false,
    1.0
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000001',
    'SOFR-IORB Spread',
    'SOFR_IORB',
    'FRED_COMPOSITE',
    'SOFR ile IORB arasindaki spread; kisa vadeli fonlama stresi gostergesi.',
    true,
    1.5
  )
ON CONFLICT (symbol) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  description = EXCLUDED.description,
  is_inverse = EXCLUDED.is_inverse,
  weight = EXCLUDED.weight;

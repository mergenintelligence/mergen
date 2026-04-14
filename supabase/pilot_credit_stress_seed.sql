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
  ),
  (
    '20000000-0000-0000-0000-000000000019',
    '10000000-0000-0000-0000-000000000001',
    'St. Louis Fed Finansal Stres Endeksi',
    'STLFSI4',
    'FRED',
    '18 farkli finansal veri serisinden olusan genel sistemik stres gostergesi.',
    true,
    2.0
  ),
  (
    '20000000-0000-0000-0000-000000000020',
    '10000000-0000-0000-0000-000000000001',
    'Chicago Fed Ulusal Finansal Kosullar Endeksi',
    'NFCI',
    'FRED',
    'Risk, kredi ve kaldirac bilesenlerini tek seride birlestiren finansal kosullar gostergesi.',
    true,
    1.8
  ),
  (
    '20000000-0000-0000-0000-000000000021',
    '10000000-0000-0000-0000-000000000001',
    'Banka Kredileri - Tum Ticari Bankalar',
    'TOTBKCR',
    'FRED',
    'Tum ticari bankalar tarafindan verilen toplam kredi; kredi genislemesi ve duraksama sinyali.',
    false,
    1.5
  ),
  (
    '20000000-0000-0000-0000-000000000022',
    '10000000-0000-0000-0000-000000000001',
    '10Y-2Y Getiri Egrisi',
    'T10Y2Y',
    'FRED',
    '10 yillik ile 2 yillik Hazine faizi arasindaki fark. Egri sifirin altina indikce resesyon sinyali guclenir.',
    false,
    1.8
  )
ON CONFLICT (symbol) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  description = EXCLUDED.description,
  is_inverse = EXCLUDED.is_inverse,
  weight = EXCLUDED.weight;

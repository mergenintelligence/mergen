-- Public Finance and Sovereign Debt category seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO categories (id, name, description, weight)
VALUES (
  '30000000-0000-0000-0000-000000000009',
  'Kamu Maliyesi ve Sovereign Borç',
  'Fiskal acik, getiri egrisi, borç/GSYIH orani ve kredi riski uzerinden devletlerin iflas riski ve borclanma surdurulebilirligini izler.',
  0.10
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  weight = EXCLUDED.weight;

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  (
    '39000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000009',
    'Federal Butce Dengesi (% GSYIH)',
    'FYFSGDA188S',
    'FRED',
    'ABD federal surplus/deficit orani. Negatif deger arttikca para basma veya yuksek faizle borclanma zorunlulugu artar.',
    true,
    2.0
  ),
  (
    '39000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000009',
    'Getiri Egrisi 10Y-3M Makasi',
    'T10Y3M',
    'FRED',
    '10 yillik ve 3 aylik hazine faizi farki. Tersine donen egri resesyonun en guclu one gosteren sinyalidir.',
    false,
    2.0
  ),
  (
    '39000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000009',
    'Brut Federal Borc (% GSYIH)',
    'GFDGDPA188S',
    'FRED',
    'ABD brut federal borcunun GSYIH ye orani. Artan oran borç cevirme maliyetini ve faiz harcamalarini arttirir.',
    true,
    2.0
  ),
  (
    '39000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000009',
    '10 Yillik TIPS Getirisi (Reel Faiz)',
    'DFII10',
    'FRED',
    'ABD 10 yillik enflasyona gore duzeltilmis hazine getirisi. Pozitif ve yukseliyor olmasi borç cevirme maliyetini arttirir.',
    true,
    1.5
  ),
  (
    '39000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000009',
    '10 Yillik ABD Hazine Faizi',
    'DGS10',
    'FRED',
    'ABD 10 yillik sabit vadeli hazine faizi. Sovereign borclanma maliyetinin ve tahvil ihale talebinin temel gostergesi.',
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

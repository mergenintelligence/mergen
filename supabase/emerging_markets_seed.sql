-- Emerging Markets category seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO categories (id, name, description, weight)
VALUES (
  '30000000-0000-0000-0000-000000000010',
  'Gelişmekte Olan Piyasalar',
  'EM ETF akilari, Cin risk proxy ve sert para borclanma uzerinden kuresel buyumenin motorunu ve sistemin en zayif halkasini izler.',
  0.10
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  weight = EXCLUDED.weight;

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  (
    '40000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000010',
    'iShares MSCI Emerging Markets ETF',
    'EEM',
    'YAHOO',
    'EM geneli sermaye akisi proxy gostergesi. IIF flow verisinin en likit piyasa yansimasi.',
    false,
    2.0
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000010',
    'iShares J.P. Morgan USD EM Bond ETF',
    'EMB',
    'YAHOO',
    'EM ulkelerinin dolar cinsinden borclanma maliyeti. Dolar guclendikce bu borc yukü artarak batma riskini yukseltir.',
    false,
    2.0
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000010',
    'iShares MSCI China Large-Cap ETF',
    'FXI',
    'YAHOO',
    'EM grubunun yuzde 30-40 ini domine eden Cin piyasa riskinin proxy gostergesi. Kredi ve gayrimenkul stresini yansitir.',
    false,
    1.5
  ),
  (
    '40000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000010',
    'iShares MSCI Brazil ETF',
    'EWZ',
    'YAHOO',
    'Emtia ihrac eden EM ulkesi proxy. Enerji fiyati arttiginda emtia ihracatcilarinin emtia ithalatcilarindan nasil ayristigini gosterir.',
    false,
    1.0
  ),
  (
    '40000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000010',
    'Brezilya Reali / ABD Dolari',
    'DEXBZUS',
    'FRED',
    'EM kur stresi ve sermaye cikisi proxy gostergesi. Real zayiflayinca EM geneli dolar stresini temsil eder.',
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

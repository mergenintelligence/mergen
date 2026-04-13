-- Precious metals category seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO categories (id, name, description, weight)
VALUES (
  '30000000-0000-0000-0000-000000000005',
  'Değerli Metaller',
  'Altin, gumus, platin ve madenci hisseleri uzerinden parasal guven, sanayi hassasiyeti ve savunma talebini izler.',
  0.10
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  weight = EXCLUDED.weight;

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  (
    '35000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000005',
    'SPDR Gold Shares',
    'GLD',
    'YAHOO',
    'Altinin parasal guven, rezerv varlik talebi ve savunma refleksini temsil eden ETF gostergesi.',
    false,
    2.0
  ),
  (
    '35000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000005',
    'iShares Silver Trust',
    'SLV',
    'YAHOO',
    'Gumusun hem parasal hem sanayi hassasiyetini birlikte tasiyan ETF gostergesi.',
    false,
    1.5
  ),
  (
    '35000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000005',
    'abrdn Physical Platinum Shares ETF',
    'PPLT',
    'YAHOO',
    'Platinin sanayi dongusu ve degerli metal rejimi arasindaki gecis sinyalini temsil eder.',
    false,
    1.0
  ),
  (
    '35000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000005',
    'abrdn Physical Palladium Shares ETF',
    'PALL',
    'YAHOO',
    'Paladyumun otomotiv/sanayi hassasiyeti ile metal sepeti icindeki ayrismayi temsil eder.',
    false,
    1.0
  ),
  (
    '35000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000005',
    'VanEck Gold Miners ETF',
    'GDX',
    'YAHOO',
    'Altin madencilerinin kaldiracli risk algisi ve operasyonel metal betasini temsil eder.',
    false,
    1.5
  ),
  (
    '35000000-0000-0000-0000-000000000006',
    '30000000-0000-0000-0000-000000000005',
    'Global X Silver Miners ETF',
    'SIL',
    'YAHOO',
    'Gumus madencileri uzerinden yuksek beta metal temasi ve sanayi-parasal dengeyi temsil eder.',
    false,
    1.0
  ),
  (
    '35000000-0000-0000-0000-000000000007',
    '30000000-0000-0000-0000-000000000005',
    'Altın/Gümüş Endeksi',
    'GOLD_SILVER_INDEX',
    'FRED_COMPOSITE',
    'GLD ve SLV bazli ortak metal gucu ve altin-gumus rejim dengesini temsil eden kompozit endeks.',
    false,
    2.0
  )
ON CONFLICT (symbol) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  description = EXCLUDED.description,
  is_inverse = EXCLUDED.is_inverse,
  weight = EXCLUDED.weight;

-- ETF and capital flows category seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO categories (id, name, description, weight)
VALUES (
  '30000000-0000-0000-0000-000000000004',
  'ETF ve Sermaye Akışı',
  'ETF akimlari, sektor rotasyonu, opsiyon konumlanmasi ve buyuk fon davranisi uzerinden sermaye hareketini izler.',
  0.10
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  weight = EXCLUDED.weight;

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  (
    '34000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000004',
    'SPY',
    'SPY',
    'YAHOO',
    'Genis piyasa ETF sermaye istahi ve pasif akim proxy gostergesi.',
    false,
    1.5
  ),
  (
    '34000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000004',
    'QQQ',
    'QQQ',
    'YAHOO',
    'Buyume ve buyuk teknoloji ETF akim proxy gostergesi.',
    false,
    1.5
  ),
  (
    '34000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000004',
    'XLF',
    'XLF',
    'YAHOO',
    'Finans sektorune yonelen sermaye akisi ve banka/risk algisi proxy gostergesi.',
    false,
    1.0
  ),
  (
    '34000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000004',
    'XLE',
    'XLE',
    'YAHOO',
    'Enerji sektorune donen sermaye rotasyonu proxy gostergesi.',
    false,
    1.0
  ),
  (
    '34000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000004',
    'ARK Innovation ETF',
    'ARKK',
    'YAHOO',
    'Spekulatif yenilik ve yuksek beta ETF akisi proxy gostergesi.',
    false,
    1.0
  ),
  (
    '34000000-0000-0000-0000-000000000006',
    '30000000-0000-0000-0000-000000000004',
    'iShares Bitcoin Trust',
    'IBIT',
    'YAHOO',
    'Spot BTC ETF araciligiyla dijital varlik sermaye akisi proxy gostergesi.',
    false,
    1.0
  ),
  (
    '34000000-0000-0000-0000-000000000007',
    '30000000-0000-0000-0000-000000000004',
    'ETF Flow Pressure',
    'ETF_FLOW_PRESSURE',
    'ETF_MANUAL',
    'Genel ETF giris-cikis baskisini temsil eden manuel akim skoru.',
    false,
    2.0
  ),
  (
    '34000000-0000-0000-0000-000000000008',
    '30000000-0000-0000-0000-000000000004',
    'Options Positioning',
    'OPTIONS_POSITIONING',
    'ETF_MANUAL',
    'Opsiyon acik pozisyon ve call-put dengesinden turetilen manuel konumlanma skoru.',
    false,
    1.5
  ),
  (
    '34000000-0000-0000-0000-000000000009',
    '30000000-0000-0000-0000-000000000004',
    'Whale 13F Concentration',
    'WHALE_13F_CONCENTRATION',
    'ETF_MANUAL',
    'Buyuk fonlarin ve 13F portfoylerinin belirli tema veya ETFlerde yogunlasma derecesi.',
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

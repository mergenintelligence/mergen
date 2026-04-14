-- ETF and capital flows category extension seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  (
    '34000000-0000-0000-0000-000000000010',
    '30000000-0000-0000-0000-000000000004',
    'RSP / SPY Oranı',
    'RSP_SPY_RATIO',
    'FRED_COMPOSITE',
    'Esit agirlikli piyasa ile piyasa degeri agirlikli piyasa arasindaki genislik oranini temsil eder.',
    false,
    1.6
  ),
  (
    '34000000-0000-0000-0000-000000000011',
    '30000000-0000-0000-0000-000000000004',
    'Para Piyasası Fonu Toplam Varlıkları',
    'WMFSL',
    'FRED',
    'Yatirimcilarin nakit ve para piyasasi araclarinda beklettigi toplam varlik buyuklugunu temsil eder.',
    false,
    1.4
  ),
  (
    '34000000-0000-0000-0000-000000000012',
    '30000000-0000-0000-0000-000000000004',
    'Tahvil vs. Hisse Akış Oranı',
    'BOND_EQUITY_FLOW_RATIO',
    'ETF_MANUAL',
    'Sermayenin risk-on hisse akimlari ile risk-off tahvil akimlari arasindaki tercih oranini temsil eder.',
    true,
    1.4
  ),
  (
    '34000000-0000-0000-0000-000000000013',
    '30000000-0000-0000-0000-000000000004',
    'ETF Kısa Pozisyon Oranı',
    'ETF_SHORT_INTEREST_RATIO',
    'ETF_MANUAL',
    'Ana endeks ETF''leri uzerindeki aciga satis baskisinin yogunlugunu temsil eder.',
    true,
    1.3
  ),
  (
    '34000000-0000-0000-0000-000000000014',
    '30000000-0000-0000-0000-000000000004',
    'Put/Call Skew',
    'ETF_PUT_CALL_SKEW',
    'ETF_MANUAL',
    'ETF opsiyon piyasasindaki koruma talebi ile yukari yonlu beklenti arasindaki dengesizligi temsil eder.',
    true,
    1.3
  ),
  (
    '34000000-0000-0000-0000-000000000015',
    '30000000-0000-0000-0000-000000000004',
    'Dark Pool Buy Volume (DIX)',
    'DARK_POOL_BUY_VOLUME',
    'ETF_MANUAL',
    'Kurumsal oyuncularin borsa disi platformlardaki sessiz alim yogunlugunu temsil eder.',
    false,
    1.3
  )
ON CONFLICT (symbol) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  description = EXCLUDED.description,
  is_inverse = EXCLUDED.is_inverse,
  weight = EXCLUDED.weight;

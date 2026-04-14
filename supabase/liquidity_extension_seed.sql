-- Liquidity category extension seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  (
    '20000000-0000-0000-0000-000000000023',
    '10000000-0000-0000-0000-000000000002',
    'Net Likidite',
    'NET_LIQUIDITY',
    'FRED_COMPOSITE',
    'Fed bilançosu eksi TGA eksi RRP ile hesaplanan piyasada aktif dolasan net dolar likiditesi gostergesi.',
    false,
    2.0
  ),
  (
    '20000000-0000-0000-0000-000000000024',
    '10000000-0000-0000-0000-000000000002',
    'Overnight Reverse Repo (RRP)',
    'RRPONTSYD',
    'FRED',
    'Fed e geri park edilen atil para. Dusmesi piyasaya likidite dondugunu gosterir.',
    true,
    1.5
  ),
  (
    '20000000-0000-0000-0000-000000000025',
    '10000000-0000-0000-0000-000000000002',
    'Hazine Genel Hesabi (TGA)',
    'WTREGEN',
    'FRED',
    'ABD Hazinesi nakit hesabi. Dusmesi kamu harcamalariyla piyasaya para girdigini gosterir.',
    true,
    1.5
  ),
  (
    '20000000-0000-0000-0000-000000000026',
    '10000000-0000-0000-0000-000000000002',
    'Banka Rezervleri',
    'BANK_RESERVES_LIQ',
    'FRED_COMPOSITE',
    'Ticari bankalarin Fed de tuttugu rezerv tamponu. 3 trilyon dolar alti sistemik kirilganlik sinyali verir.',
    false,
    1.3
  ),
  (
    '20000000-0000-0000-0000-000000000027',
    '10000000-0000-0000-0000-000000000002',
    'Net Likidite Ivmesi',
    'NET_LIQUIDITY_ROC',
    'FRED_COMPOSITE',
    'Net likiditenin 4 haftalik degisim hizi. Fiyatlamalara one giden momentum sinyali verir.',
    false,
    1.7
  ),
  (
    '20000000-0000-0000-0000-000000000059',
    '10000000-0000-0000-0000-000000000002',
    '10Y-2Y Makası',
    'T10Y2Y_LIQUIDITY',
    'FRED',
    'Likidite rejimi acisindan getiri egrisinin dikligi ve kredi aktarim kanalinin sagligini temsil eder.',
    false,
    1.2
  ),
  (
    '20000000-0000-0000-0000-000000000060',
    '10000000-0000-0000-0000-000000000002',
    'Para Piyasası Fonu Toplam Varlıkları',
    'WMFSL_LIQUIDITY',
    'FRED',
    'Kenarda bekleyen nakit ve para piyasasina park edilen likidite stokunu likidite kategorisi icinde takip eden alias gosterge.',
    false,
    1.1
  )
ON CONFLICT (symbol) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  description = EXCLUDED.description,
  is_inverse = EXCLUDED.is_inverse,
  weight = EXCLUDED.weight;

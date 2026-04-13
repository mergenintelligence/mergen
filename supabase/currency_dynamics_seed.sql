-- Currency and Exchange Rate Dynamics category seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO categories (id, name, description, weight)
VALUES (
  '30000000-0000-0000-0000-000000000008',
  'Döviz ve Kur Dinamikleri',
  'Yen carry trade, reel efektif kurlar ve dolar hegemonyasi uzerinden kuresel likiditenin fiyatlandigi kur dengesini izler.',
  0.10
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  weight = EXCLUDED.weight;

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  (
    '38000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000008',
    'CurrencyShares Japon Yeni ETF',
    'FXY',
    'YAHOO',
    'Yen carry trade konumlanmasinin ETF proxy gostergesi. Yen guclendiginde carry unwinding riskini temsil eder.',
    false,
    2.0
  ),
  (
    '38000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000008',
    'Japon Yeni / ABD Dolari Kuru',
    'DEXJPUS',
    'FRED',
    'FRED gunluk JPY/USD kuru. Yuksek deger (zayif yen) carry trade cozulme riskini arttirir.',
    true,
    2.0
  ),
  (
    '38000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000008',
    'ABD Reel Genis Efektif Doviz Kuru (REER)',
    'RBUSBIS',
    'FRED',
    'BIS kaynakli ABD reel genis efektif kuru. Cok pahalilasan dolar ihracat kaybi ve devalüasyon riskini arttirir.',
    true,
    2.0
  ),
  (
    '38000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000008',
    'Cin Yuani / ABD Dolari Kuru',
    'DEXCHUS',
    'FRED',
    'FRED gunluk CNY/USD kuru. Yuan zayiflamasi dolarizasyon basincini ve EM sermaye cikisini temsil eder.',
    true,
    1.5
  ),
  (
    '38000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000008',
    'Fed Ticaret Agirlikli Dolar Endeksi',
    'DTWEXBGSR',
    'FRED',
    'Federal Reserve genis nominal ticaret agirlikli dolar endeksi (revize seri). DX-Y.NYB dan farkli olarak daha genis bir sepeti kapsar.',
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

-- Precious metals category extension seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  (
    '35000000-0000-0000-0000-000000000008',
    '30000000-0000-0000-0000-000000000005',
    'Altın / Reel Faiz Sinyali',
    'GOLD_REAL_RATE_SIGNAL',
    'FRED_COMPOSITE',
    'Altin ile 10 yillik reel faizler arasindaki ters iliskiyi temsil eden kompozit sinyal.',
    false,
    1.6
  ),
  (
    '35000000-0000-0000-0000-000000000009',
    '30000000-0000-0000-0000-000000000005',
    'Merkez Bankası Net Altın Alımları',
    'CENTRAL_BANK_GOLD_BUYING',
    'PRECIOUS_MANUAL',
    'Merkez bankalarinin net altin alim hizini ve rezerv tercihini temsil eder.',
    false,
    1.5
  ),
  (
    '35000000-0000-0000-0000-000000000010',
    '30000000-0000-0000-0000-000000000005',
    'COMEX Registered Stokları',
    'COMEX_REGISTERED_STOCKS',
    'PRECIOUS_MANUAL',
    'Teslimata hazir fiziksel metal stok seviyesini temsil eder.',
    false,
    1.3
  ),
  (
    '35000000-0000-0000-0000-000000000011',
    '30000000-0000-0000-0000-000000000005',
    'US Mint Altın/Gümüş Satışları',
    'US_MINT_BULLION_SALES',
    'PRECIOUS_MANUAL',
    'Bireysel yatirimcinin kriz ve guvenli liman talebini temsil eden perakende bullion satis gostergesi.',
    false,
    1.1
  ),
  (
    '35000000-0000-0000-0000-000000000012',
    '30000000-0000-0000-0000-000000000005',
    'Altın / S&P 500 Oranı',
    'GOLD_SPY_RATIO',
    'FRED_COMPOSITE',
    'Guvenli liman ile riskli varlik tercihi arasindaki makro dongu oranini temsil eder.',
    false,
    1.4
  ),
  (
    '35000000-0000-0000-0000-000000000013',
    '30000000-0000-0000-0000-000000000005',
    'COT Net Spekülatif Pozisyon',
    'COT_NET_SPEC_POSITION',
    'PRECIOUS_MANUAL',
    'Buyuk spekulatif fonlarin net long-short pozisyon dengesini temsil eder.',
    true,
    1.2
  ),
  (
    '35000000-0000-0000-0000-000000000014',
    '30000000-0000-0000-0000-000000000005',
    'Fiziksel Gümüş Primleri',
    'PHYSICAL_SILVER_PREMIUM',
    'PRECIOUS_MANUAL',
    'Perakende fiziksel gumus fiyatinin spot piyasaya gore tasidigi primi temsil eder.',
    true,
    1.1
  ),
  (
    '35000000-0000-0000-0000-000000000015',
    '30000000-0000-0000-0000-000000000005',
    'Altın / Petrol Oranı',
    'GOLD_OIL_RATIO',
    'FRED_COMPOSITE',
    'Bir ons altinla alinabilen petrol miktarini temsil eden makro risk oranidir.',
    false,
    1.3
  ),
  (
    '35000000-0000-0000-0000-000000000016',
    '30000000-0000-0000-0000-000000000005',
    'Altın / Gümüş Rasyosu',
    'GOLD_SILVER_RATIO_PM',
    'FRED_COMPOSITE',
    'Altin ile gumus arasindaki parasal-sanayi ayrismasini degerli metaller kategorisi icinde takip eden alias orandir.',
    false,
    1.2
  )
ON CONFLICT (symbol) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  description = EXCLUDED.description,
  is_inverse = EXCLUDED.is_inverse,
  weight = EXCLUDED.weight;

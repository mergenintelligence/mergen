-- Fed internal power balance extension seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  (
    '33000000-0000-0000-0000-000000000009',
    '30000000-0000-0000-0000-000000000003',
    'FOMC Dissent Index',
    'FOMC_DISSENT_INDEX',
    'FED_MANUAL',
    'Karar toplantilarinda muhalif oy kullanan uye sayisini ve baskanlik otoritesindeki asinmayi temsil eder.',
    true,
    1.6
  ),
  (
    '33000000-0000-0000-0000-000000000010',
    '30000000-0000-0000-0000-000000000003',
    'Fed Speak Sentiment Momentum',
    'FED_SPEAK_SENTIMENT_MOMENTUM',
    'FED_SPEECH',
    'Fed uyelerinin konusmalarinda medyan sahin-guvercin ton kaymasini temsil eder.',
    false,
    1.8
  ),
  (
    '33000000-0000-0000-0000-000000000011',
    '30000000-0000-0000-0000-000000000003',
    'Policy Rule Deviation',
    'POLICY_RULE_DEVIATION',
    'FED_MANUAL',
    'Taylor kurali benzeri referanslara gore Fed''in fiili politika durusundaki sapmayi olcer.',
    true,
    1.5
  ),
  (
    '33000000-0000-0000-0000-000000000012',
    '30000000-0000-0000-0000-000000000003',
    'District Growth Dispersion',
    'DISTRICT_GROWTH_DISPERSION',
    'FED_MANUAL',
    '12 Fed bolgesinin ekonomik gorunum farkliligi uzerinden bolgesel fikir ayriligini temsil eder.',
    true,
    1.4
  ),
  (
    '33000000-0000-0000-0000-000000000013',
    '30000000-0000-0000-0000-000000000003',
    'Shadow Rate Gap',
    'SHADOW_RATE_GAP',
    'FED_MANUAL',
    'Resmi faiz ile siradisi araclarin yarattigi golge faiz arasindaki farki temsil eder.',
    true,
    1.4
  ),
  (
    '33000000-0000-0000-0000-000000000014',
    '30000000-0000-0000-0000-000000000003',
    'Congressional Hearing Aggression Score',
    'CONGRESSIONAL_AGGRESSION_SCORE',
    'FED_MANUAL',
    'Kongre sunumlarindaki sorgulama tonunun sertligini ve siyasi baski yogunlugunu temsil eder.',
    true,
    1.3
  )
ON CONFLICT (symbol) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  description = EXCLUDED.description,
  is_inverse = EXCLUDED.is_inverse,
  weight = EXCLUDED.weight;

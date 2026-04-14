-- Technology and structural transformation category extension seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  (
    '32000000-0000-0000-0000-000000000020',
    '30000000-0000-0000-0000-000000000002',
    'Global X Robotics & Artificial Intelligence ETF',
    'BOTZ',
    'YAHOO',
    'AI''nin robotik, otomasyon ve fiziksel dunya uygulamalarindaki buyumesini temsil eden ETF gostergesi.',
    false,
    1.3
  ),
  (
    '32000000-0000-0000-0000-000000000021',
    '30000000-0000-0000-0000-000000000002',
    'Open Source AI Activity',
    'OPEN_SOURCE_AI_ACTIVITY',
    'TECH_MANUAL',
    'GitHub ve Hugging Face tabanli acik kaynak AI benimsenmesi ve model yayilim ivmesini temsil eder.',
    false,
    1.2
  ),
  (
    '32000000-0000-0000-0000-000000000022',
    '30000000-0000-0000-0000-000000000002',
    'Corporate R&D Intensity',
    'CORPORATE_RD_INTENSITY',
    'TECH_MANUAL',
    'Buyuk teknoloji sirketlerinin gelirlerine oranla Ar-Ge harcamalarini olcer.',
    false,
    1.4
  ),
  (
    '32000000-0000-0000-0000-000000000023',
    '30000000-0000-0000-0000-000000000002',
    'AI Patent Filings',
    'AI_PATENT_FILINGS',
    'TECH_MANUAL',
    'WIPO/USPTO ekseninde AI odakli fikri mulkiyet uretim hizini temsil eder.',
    false,
    1.2
  ),
  (
    '32000000-0000-0000-0000-000000000024',
    '30000000-0000-0000-0000-000000000002',
    'Renewable Energy Generation Mix',
    'RENEWABLE_ENERGY_MIX',
    'TECH_MANUAL',
    'Veri merkezi ve dijital altyapi talebinin ne kadarinin yesil enerjiyle beslendigini gosterir.',
    false,
    1.1
  ),
  (
    '32000000-0000-0000-0000-000000000025',
    '30000000-0000-0000-0000-000000000002',
    'SaaS Revenue Growth Index',
    'SAAS_REVENUE_GROWTH',
    'TECH_MANUAL',
    'Bulut ve abonelik tabanli yazilim is modellerindeki buyume ivmesini temsil eder.',
    false,
    1.2
  ),
  (
    '32000000-0000-0000-0000-000000000026',
    '30000000-0000-0000-0000-000000000002',
    'Invesco NASDAQ Internet ETF',
    'PNQI',
    'YAHOO',
    'Dijital ekonomi ve internet tabanli is modellerinin genis sagligini temsil eden ETF gostergesi.',
    false,
    1.1
  ),
  (
    '32000000-0000-0000-0000-000000000027',
    '30000000-0000-0000-0000-000000000002',
    'Nasdaq 100',
    'QQQ_TECH',
    'YAHOO',
    'Buyuk teknoloji ve buyume hisselerinin teknoloji kategorisi icindeki liderlik genisligini temsil eden alias gosterge.',
    false,
    1.4
  ),
  (
    '32000000-0000-0000-0000-000000000028',
    '30000000-0000-0000-0000-000000000002',
    'ARK Innovation ETF',
    'ARKK_TECH',
    'YAHOO',
    'Spekulatif teknoloji sermayesi ve anlati duyarliligini teknoloji kategorisi icinde takip eden alias gosterge.',
    false,
    1.0
  )
ON CONFLICT (symbol) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  description = EXCLUDED.description,
  is_inverse = EXCLUDED.is_inverse,
  weight = EXCLUDED.weight;

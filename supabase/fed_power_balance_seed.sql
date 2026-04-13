-- Fed internal power balance category seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO categories (id, name, description, weight)
VALUES (
  '30000000-0000-0000-0000-000000000003',
  'Fed İçi Güç Dengesi',
  'Fed karar vericilerinin kurumsal kokeni, siyasi baglantilari, konusma tonu ve Wall Street etkilesimi uzerinden guc dengesini izler.',
  0.10
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  weight = EXCLUDED.weight;

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  (
    '33000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000003',
    'Governor Origin Score',
    'FED_GOV_ORIGIN_SCORE',
    'FED_MANUAL',
    'Kurul uyelerinin Wall Street, akademi ve hukumet kokenlerine gore hesaplanan guc kompozisyonu skoru.',
    true,
    1.5
  ),
  (
    '33000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000003',
    'Political Appointment Tilt',
    'FED_POLITICAL_TILT',
    'FED_MANUAL',
    'Atayan baskan, Senato onayi ve siyasi blok etkisine gore hesaplanan siyasi egilim skoru.',
    true,
    1.0
  ),
  (
    '33000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000003',
    'Think Tank Network Density',
    'FED_THINK_TANK_DENSITY',
    'FED_MANUAL',
    'Fed uyelerinin think-tank ve politika aglariyla baglantisinin yogunlugunu temsil eder.',
    true,
    1.0
  ),
  (
    '33000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000003',
    'Revolving Door Intensity',
    'FED_REVOLVING_DOOR',
    'FED_MANUAL',
    'Fed oncesi ve sonrasi ozel sektor gecislerinin yogunlugunu ve olasi etkisini temsil eder.',
    true,
    1.5
  ),
  (
    '33000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000003',
    'Regional Hawk-Dove Score',
    'FED_HAWK_DOVE_SCORE',
    'FED_SPEECH',
    'Bolgesel Fed baskanlarinin konusma tonundan cikarilan sahin-guvercin skoru.',
    false,
    2.0
  ),
  (
    '33000000-0000-0000-0000-000000000006',
    '30000000-0000-0000-0000-000000000003',
    'NY Fed Wall Street Linkage',
    'NYFED_WALLSTREET_LINKAGE',
    'FED_MANUAL',
    'NY Fed yonetimindeki mevcut ve gecmis Wall Street baglantilarinin yogunlugunu temsil eder.',
    true,
    1.5
  ),
  (
    '33000000-0000-0000-0000-000000000007',
    '30000000-0000-0000-0000-000000000003',
    'Sector Meeting Concentration',
    'FED_SECTOR_MEETING_CONCENTRATION',
    'FED_MANUAL',
    'Fed uyelerinin sektor temsilcileriyle gorusme yogunlugunun tekil alanlarda toplanma derecesini izler.',
    true,
    1.0
  ),
  (
    '33000000-0000-0000-0000-000000000008',
    '30000000-0000-0000-0000-000000000003',
    'Primary Dealer Influence',
    'FED_PRIMARY_DEALER_INFLUENCE',
    'FED_MANUAL',
    'Primary dealer yapisinin operasyonel gucu ve Fed kokenli isim yogunlugu uzerinden etki skoru.',
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

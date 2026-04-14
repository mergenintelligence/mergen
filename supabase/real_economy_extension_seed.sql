-- Real economy and growth category extension seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  (
    '20000000-0000-0000-0000-000000000028',
    '10000000-0000-0000-0000-000000000003',
    'ISM İmalat Endeksi (PMI)',
    'NAPM',
    'FRED',
    'ISM imalat PMI. 50 uzeri genisleme, 50 alti daralma sinyalidir ve sanayi dongusunun oncu gostergesidir.',
    false,
    1.8
  ),
  (
    '20000000-0000-0000-0000-000000000029',
    '10000000-0000-0000-0000-000000000003',
    'Haftalık İşsizlik Maaşı Başvuruları',
    'ICSA',
    'FRED',
    'Haftalik initial claims verisi. Isgucu piyasasindaki ani bozulmalari erken yakalar.',
    true,
    1.8
  ),
  (
    '20000000-0000-0000-0000-000000000030',
    '10000000-0000-0000-0000-000000000003',
    'Reel Perakende Satışlar',
    'RRSFS',
    'FRED',
    'Enflasyondan arindirilmis perakende satislar. Tuketici talebinin gercek gucunu gosterir.',
    false,
    1.7
  ),
  (
    '20000000-0000-0000-0000-000000000031',
    '10000000-0000-0000-0000-000000000003',
    'Kapasite Kullanım Oranı',
    'TCU',
    'FRED',
    'Sanayi kapasitesinin ne kadarinin kullanildigini gosterir. Yuksek kullanim yeni yatirim ve enflasyon baskisi yaratir.',
    false,
    1.3
  ),
  (
    '20000000-0000-0000-0000-000000000032',
    '10000000-0000-0000-0000-000000000003',
    'Reel Kişisel Harcanabilir Gelir',
    'DSPIC96',
    'FRED',
    'Enflasyondan arindirilmis halk geliri ve alim gucu gostergesi.',
    false,
    1.7
  )
ON CONFLICT (symbol) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  description = EXCLUDED.description,
  is_inverse = EXCLUDED.is_inverse,
  weight = EXCLUDED.weight;

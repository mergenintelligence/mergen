-- Social and political stability category seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO categories (id, name, description, weight)
VALUES (
  '30000000-0000-0000-0000-000000000001',
  'Siyasi ve Sosyal İstikrar',
  'Demokrasi kalitesi, toplumsal memnuniyet, kurumsal guven ve sosyal gerilim gostergeleri uzerinden istikrar rejimini izler.',
  0.15
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  weight = EXCLUDED.weight;

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  (
    '31000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    'V-Dem Liberal Democracy Index',
    'VDEM_LDI',
    'VDEM',
    'Demokrasi kalitesi ve kurumsal dengeyi izleyen kompozit endeks.',
    false,
    2.0
  ),
  (
    '31000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    'World Happiness Score',
    'WHR_SCORE',
    'WORLD_HAPPINESS',
    'Toplumsal memnuniyet ve yasam kalitesi algisini izleyen skor.',
    false,
    1.0
  ),
  (
    '31000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000001',
    'Edelman Trust Barometer',
    'EDELMAN_TRUST',
    'EDELMAN',
    'Kamu, is dunyasi, medya ve STKlara duyulan guven seviyesi.',
    false,
    1.0
  ),
  (
    '31000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000001',
    'Top 10% Wealth Share',
    'WID_TOP10_SHARE',
    'WID',
    'Servetin en ust %10 kesimde yogunlasma payi.',
    true,
    1.5
  ),
  (
    '31000000-0000-0000-0000-000000000007',
    '30000000-0000-0000-0000-000000000001',
    'Bottom 50% Wealth Share',
    'WID_BOTTOM50_SHARE',
    'WID',
    'Servetin alt %50 kesimdeki payi.',
    false,
    1.5
  ),
  (
    '31000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000001',
    'Grev Sayisi',
    'CORNELL_STRIKES',
    'CORNELL_ILR',
    'Calisma hayatindaki gerilim ve uyusmazlik yogunlugu.',
    true,
    1.0
  ),
  (
    '31000000-0000-0000-0000-000000000006',
    '30000000-0000-0000-0000-000000000001',
    'Mainstream Parti Oy Kaybi',
    'MAINSTREAM_VOTE_LOSS',
    'ELECTION_DATA',
    'Ana akim siyasi partilerin secim performansindaki asindirma.',
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

-- Precious metals category seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO categories (id, name, description, weight)
VALUES (
  '30000000-0000-0000-0000-000000000005',
  'Değerli Metaller',
  'Altin, gumus, platin ve madenci hisseleri uzerinden parasal guven, sanayi hassasiyeti ve savunma talebini izler.',
  0.10
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  weight = EXCLUDED.weight;

WITH desired_metrics (id, category_id, name, symbol, source, description, is_inverse, weight) AS (
  VALUES
    ('35000000-0000-0000-0000-000000000001'::uuid,'30000000-0000-0000-0000-000000000005'::uuid,'Altın','GOLD_SPOT_PM','YAHOO','Altinin uluslararasi ons fiyatini temsil eden ana referans spot/futures gostergesi.',false,2.0),
    ('35000000-0000-0000-0000-000000000002'::uuid,'30000000-0000-0000-0000-000000000005'::uuid,'Gümüş','SILVER_SPOT_PM','YAHOO','Gumusun uluslararasi ons fiyatini temsil eden ana referans spot/futures gostergesi.',false,1.5),
    ('35000000-0000-0000-0000-000000000003'::uuid,'30000000-0000-0000-0000-000000000005'::uuid,'Platin','PLATINUM_SPOT_PM','YAHOO','Platinin uluslararasi ons fiyatini temsil eden ana referans spot/futures gostergesi.',false,1.0),
    ('35000000-0000-0000-0000-000000000004'::uuid,'30000000-0000-0000-0000-000000000005'::uuid,'Paladyum','PALLADIUM_SPOT_PM','YAHOO','Paladyumun uluslararasi ons fiyatini temsil eden ana referans spot/futures gostergesi.',false,1.0),
    ('35000000-0000-0000-0000-000000000021'::uuid,'30000000-0000-0000-0000-000000000005'::uuid,'Rodyum','RHODIUM_SPOT','PRECIOUS_MANUAL','Rodyumun asiri dar arz yapisi ve otomotiv katalizor talebi nedeniyle oynaklasan spot fiyat rejimini temsil eder.',false,0.9),
    ('35000000-0000-0000-0000-000000000022'::uuid,'30000000-0000-0000-0000-000000000005'::uuid,'İridyum','IRIDIUM_SPOT','PRECIOUS_MANUAL','Iridyumun ileri teknoloji, kimya ve hidrojen ekosistemi baglantili nadir metal fiyat davranisini temsil eder.',false,0.8),
    ('35000000-0000-0000-0000-000000000023'::uuid,'30000000-0000-0000-0000-000000000005'::uuid,'Rutenyum','RUTHENIUM_SPOT','PRECIOUS_MANUAL','Rutenyumun elektronik, katalizor ve endustriyel kullanim kaynakli nadir metal fiyat davranisini temsil eder.',false,0.8),
    ('35000000-0000-0000-0000-000000000024'::uuid,'30000000-0000-0000-0000-000000000005'::uuid,'Osmiyum','OSMIUM_SPOT','PRECIOUS_MANUAL','Osmiyumun asiri kisitli fiziksel arz ve koleksiyon tipi talep nedeniyle farkli davranan nadir metal fiyat rejimini temsil eder.',false,0.7),
    ('35000000-0000-0000-0000-000000000018'::uuid,'30000000-0000-0000-0000-000000000005'::uuid,'VanEck Gold Miners ETF','GDX','YAHOO','Altin madencilerinin kaldiracli risk algisi ve operasyonel metal betasini temsil eder.',false,1.5),
    ('35000000-0000-0000-0000-000000000019'::uuid,'30000000-0000-0000-0000-000000000005'::uuid,'Global X Silver Miners ETF','SIL','YAHOO','Gumus madencileri uzerinden yuksek beta metal temasi ve sanayi-parasal dengeyi temsil eder.',false,1.0),
    ('35000000-0000-0000-0000-000000000020'::uuid,'30000000-0000-0000-0000-000000000005'::uuid,'Altın/Gümüş Endeksi','GOLD_SILVER_INDEX','FRED_COMPOSITE','GLD ve SLV bazli ortak metal gucu ve altin-gumus rejim dengesini temsil eden kompozit endeks.',false,2.0)
),
updated_by_id AS (
  UPDATE metrics AS m
  SET
    category_id = d.category_id,
    name = d.name,
    symbol = d.symbol,
    source = d.source,
    description = d.description,
    is_inverse = d.is_inverse,
    weight = d.weight
  FROM desired_metrics AS d
  WHERE m.id = d.id
  RETURNING m.id
),
updated_by_symbol AS (
  UPDATE metrics AS m
  SET
    category_id = d.category_id,
    name = d.name,
    source = d.source,
    description = d.description,
    is_inverse = d.is_inverse,
    weight = d.weight
  FROM desired_metrics AS d
  WHERE m.symbol = d.symbol
    AND NOT EXISTS (SELECT 1 FROM updated_by_id u WHERE u.id = m.id)
  RETURNING m.id
)
INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
SELECT d.id, d.category_id, d.name, d.symbol, d.source, d.description, d.is_inverse, d.weight
FROM desired_metrics AS d
WHERE NOT EXISTS (
  SELECT 1
  FROM metrics AS m
  WHERE m.id = d.id OR m.symbol = d.symbol
);

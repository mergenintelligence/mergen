-- Adds WID wealth-share metrics used instead of Gini in the social stability category.
-- Safe to run multiple times.

DELETE FROM metrics
WHERE symbol = 'WID_GINI';

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
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
  )
ON CONFLICT (symbol) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  description = EXCLUDED.description,
  is_inverse = EXCLUDED.is_inverse,
  weight = EXCLUDED.weight;

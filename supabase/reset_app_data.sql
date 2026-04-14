-- Reset only app data tables for a clean reseed.
-- Safe for early-stage rebuilds, but this deletes all metric values, scores,
-- alerts, AI insights, categories and metrics.

BEGIN;

TRUNCATE TABLE ai_insights RESTART IDENTITY CASCADE;
TRUNCATE TABLE alerts RESTART IDENTITY CASCADE;
TRUNCATE TABLE scores RESTART IDENTITY CASCADE;
TRUNCATE TABLE metric_values RESTART IDENTITY CASCADE;
TRUNCATE TABLE metrics RESTART IDENTITY CASCADE;
TRUNCATE TABLE categories RESTART IDENTITY CASCADE;

COMMIT;

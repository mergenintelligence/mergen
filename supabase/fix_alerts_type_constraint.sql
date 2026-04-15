-- Fix alerts table type constraint
-- Old constraint used 'yellow', 'red', 'category', 'cross_risk'
-- but alertWorker.ts inserts 'threshold', 'momentum', 'divergence'
-- This mismatch caused all alert inserts to fail silently.

ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_type_check;

ALTER TABLE alerts
  ADD CONSTRAINT alerts_type_check
  CHECK (type IN ('threshold', 'momentum', 'divergence'));

import { fetchFredSeries } from './fred';

type SyncMetricInput = {
  id: string;
  symbol: string;
  source: string;
  name: string;
};

const SUPPORTED_DIRECT_SOURCES = new Set([
  'FRED',
  'YAHOO',
  'FRED_COMPOSITE',
  'CRYPTO_API',
  'INFLATION_MANUAL',
  'GLOBAL_RISK_MANUAL',
  'CREDIT_MANUAL',
  'REAL_ECON_MANUAL',
  'SOCIAL_MANUAL',
  'TECH_MANUAL',
  'FED_MANUAL',
  'FED_SPEECH',
  'ETF_MANUAL',
  'PRECIOUS_MANUAL',
  'AGRI_MANUAL',
  'EDELMAN',
  'ELECTION_DATA',
  'EM_MANUAL',
  'SOVEREIGN_MANUAL',
  'FX_MANUAL',
  'ENERGY_MANUAL',
]);

export async function syncMetric(metric: SyncMetricInput) {
  if (SUPPORTED_DIRECT_SOURCES.has(metric.source)) {
    await fetchFredSeries(metric.symbol, metric.id);
    return {
      status: 'synced' as const,
      message: `${metric.name} synced`,
    };
  }

  return {
    status: 'skipped' as const,
    message: `${metric.name} skipped: source ${metric.source} is not connected yet`,
  };
}

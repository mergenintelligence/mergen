import { fetchFredSeries } from './fred';

type SyncMetricInput = {
  id: string;
  symbol: string;
  source: string;
  name: string;
};

const SUPPORTED_DIRECT_SOURCES = new Set(['FRED', 'YAHOO', 'FRED_COMPOSITE']);

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

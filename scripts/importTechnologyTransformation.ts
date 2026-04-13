import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { supabaseNode } from '../src/lib/supabaseNode';

const DATA_DIR = path.join(process.cwd(), 'data', 'technology-transformation');
const HYPERSCALER_CAPEX_FILE = path.join(DATA_DIR, 'hyperscaler_ai_capex.csv');
const IEA_POWER_FILE = path.join(DATA_DIR, 'iea_data_center_power.csv');
const TSMC_DEPENDENCY_FILE = path.join(DATA_DIR, 'tsmc_dependency.csv');
const STRATEGIC_VALUE_FILE = path.join(DATA_DIR, 'strategic_value_index.csv');

type MetricEntry = {
  date: string;
  value: number;
};

function extractGenericRows(filePath: string): MetricEntry[] {
  const scriptPath = path.join(process.cwd(), 'scripts', 'extract_technology_dataset.py');
  const output = execFileSync('python3', [scriptPath, 'generic', filePath], {
    encoding: 'utf8',
  });

  return JSON.parse(output) as MetricEntry[];
}

async function upsertMetricValues(metricSymbol: string, entries: MetricEntry[]) {
  if (entries.length === 0) {
    console.log(`No entries found for ${metricSymbol}`);
    return;
  }

  const { data: metric, error: metricError } = await supabaseNode
    .from('metrics')
    .select('id')
    .eq('symbol', metricSymbol)
    .single();

  if (metricError || !metric) {
    throw new Error(`Metric not found for symbol ${metricSymbol}`);
  }

  const payload = entries.map((entry) => ({
    metric_id: metric.id,
    date: entry.date,
    value: entry.value,
  }));

  const { error } = await supabaseNode
    .from('metric_values')
    .upsert(payload, { onConflict: 'metric_id, date' });

  if (error) {
    throw error;
  }

  console.log(`Imported ${entries.length} rows for ${metricSymbol}`);
}

async function importOptional(filePath: string, symbol: string, label: string) {
  try {
    await fs.access(filePath);
  } catch {
    console.log(`Skipping ${label}: ${path.basename(filePath)} not found.`);
    return;
  }

  const rows = extractGenericRows(filePath);
  await upsertMetricValues(symbol, rows);
}

async function main() {
  console.log('Importing technology transformation datasets...');
  await importOptional(HYPERSCALER_CAPEX_FILE, 'AI_CAPEX_HYPERSCALERS', 'Hyperscaler AI Capex');
  await importOptional(IEA_POWER_FILE, 'IEA_DC_POWER_DEMAND', 'IEA Data Center Power');
  await importOptional(TSMC_DEPENDENCY_FILE, 'TSMC_ADV_NODE_SHARE', 'TSMC Dependency');
  await importOptional(STRATEGIC_VALUE_FILE, 'STRATEGIC_VALUE_INDEX', 'Strategic Value Index');
  console.log('Technology transformation import completed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

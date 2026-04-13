import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { supabaseNode } from '../src/lib/supabaseNode';

const DATA_DIR = path.join(process.cwd(), 'data', 'etf-capital-flows');
const ETF_FLOW_PRESSURE_FILE = path.join(DATA_DIR, 'etf_flow_pressure.csv');
const OPTIONS_POSITIONING_FILE = path.join(DATA_DIR, 'options_positioning.csv');
const WHALE_13F_CONCENTRATION_FILE = path.join(DATA_DIR, 'whale_13f_concentration.csv');

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

async function importOptional(filePath: string, metricSymbol: string, label: string) {
  try {
    await fs.access(filePath);
  } catch {
    console.log(`Skipping ${label}: ${path.basename(filePath)} not found.`);
    return;
  }

  const rows = extractGenericRows(filePath);
  await upsertMetricValues(metricSymbol, rows);
}

async function main() {
  console.log('Importing ETF and capital flows datasets...');
  await importOptional(ETF_FLOW_PRESSURE_FILE, 'ETF_FLOW_PRESSURE', 'ETF Flow Pressure');
  await importOptional(OPTIONS_POSITIONING_FILE, 'OPTIONS_POSITIONING', 'Options Positioning');
  await importOptional(WHALE_13F_CONCENTRATION_FILE, 'WHALE_13F_CONCENTRATION', 'Whale 13F Concentration');
  console.log('ETF and capital flows import completed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { supabaseNode } from '../src/lib/supabaseNode';

const DATA_DIR = path.join(process.cwd(), 'data', 'social-stability');
const VDEM_FILE = path.join(DATA_DIR, 'vdem_country_year_core.csv');
const WHR_FILE = path.join(DATA_DIR, 'world_happiness.csv');
const WID_FILE = path.join(DATA_DIR, 'wid_gini.csv');
const CORNELL_FILE = path.join(DATA_DIR, 'cornell_strikes.csv');
const MAINSTREAM_VOTE_LOSS_FILE = path.join(DATA_DIR, 'mainstream_vote_loss.csv');

const COUNTRY_CANDIDATES = (
  process.env.MERGEN_COUNTRY_NAMES ||
  'United States of America|United States|USA'
)
  .split('|')
  .map((value) => value.trim())
  .filter(Boolean);

type MetricEntry = {
  date: string;
  value: number;
};

function extractDatasetRows(dataset: 'vdem' | 'whr' | 'cornell' | 'mainstream_vote_loss', filePath: string): MetricEntry[] {
  const scriptPath = path.join(process.cwd(), 'scripts', 'extract_social_dataset.py');
  const output = execFileSync('python3', [scriptPath, dataset, filePath, COUNTRY_CANDIDATES.join('|')], {
    encoding: 'utf8',
  });

  return JSON.parse(output) as MetricEntry[];
}

function extractWidMetricRows(filePath: string): Record<string, MetricEntry[]> {
  const scriptPath = path.join(process.cwd(), 'scripts', 'extract_social_dataset.py');
  const output = execFileSync('python3', [scriptPath, 'wid', filePath, COUNTRY_CANDIDATES.join('|')], {
    encoding: 'utf8',
  });

  return JSON.parse(output) as Record<string, MetricEntry[]>;
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

async function importVdem() {
  await fs.access(VDEM_FILE);
  const rows = extractDatasetRows('vdem', VDEM_FILE);
  await upsertMetricValues('VDEM_LDI', rows);
}

async function importWorldHappiness() {
  await fs.access(WHR_FILE);
  const rows = extractDatasetRows('whr', WHR_FILE);
  await upsertMetricValues('WHR_SCORE', rows);
}

async function importWidGini() {
  try {
    await fs.access(WID_FILE);
  } catch {
    console.log('Skipping WID shares: wid_gini.csv not found.');
    return;
  }

  const rowsByMetric = extractWidMetricRows(WID_FILE);
  await upsertMetricValues('WID_TOP10_SHARE', rowsByMetric.WID_TOP10_SHARE || []);
  await upsertMetricValues('WID_BOTTOM50_SHARE', rowsByMetric.WID_BOTTOM50_SHARE || []);
}

async function importCornellStrikes() {
  try {
    await fs.access(CORNELL_FILE);
  } catch {
    console.log('Skipping CORNELL_STRIKES: cornell_strikes.csv not found.');
    return;
  }

  const rows = extractDatasetRows('cornell', CORNELL_FILE);
  await upsertMetricValues('CORNELL_STRIKES', rows);
}

async function importMainstreamVoteLoss() {
  try {
    await fs.access(MAINSTREAM_VOTE_LOSS_FILE);
  } catch {
    console.log('Skipping MAINSTREAM_VOTE_LOSS: mainstream_vote_loss.csv not found.');
    return;
  }

  const rows = extractDatasetRows('mainstream_vote_loss', MAINSTREAM_VOTE_LOSS_FILE);
  await upsertMetricValues('MAINSTREAM_VOTE_LOSS', rows);
}

async function main() {
  console.log('Importing social stability datasets...');
  await importVdem();
  await importWorldHappiness();
  await importWidGini();
  await importCornellStrikes();
  await importMainstreamVoteLoss();
  console.log('Social stability import completed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

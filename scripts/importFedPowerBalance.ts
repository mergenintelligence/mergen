import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { supabaseNode } from '../src/lib/supabaseNode';

const DATA_DIR = path.join(process.cwd(), 'data', 'fed-power');
const HAWK_DOVE_FILE = path.join(DATA_DIR, 'fed_hawk_dove_score.csv');
const GOVERNOR_ORIGIN_FILE = path.join(DATA_DIR, 'fed_governor_origin_score.csv');
const POLITICAL_TILT_FILE = path.join(DATA_DIR, 'fed_political_tilt.csv');
const THINK_TANK_FILE = path.join(DATA_DIR, 'fed_think_tank_density.csv');
const REVOLVING_DOOR_FILE = path.join(DATA_DIR, 'fed_revolving_door.csv');
const NYFED_LINKAGE_FILE = path.join(DATA_DIR, 'nyfed_wallstreet_linkage.csv');
const SECTOR_MEETING_FILE = path.join(DATA_DIR, 'fed_sector_meeting_concentration.csv');
const PRIMARY_DEALER_FILE = path.join(DATA_DIR, 'fed_primary_dealer_influence.csv');

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
  console.log('Importing Fed power balance datasets...');
  await importOptional(HAWK_DOVE_FILE, 'FED_HAWK_DOVE_SCORE', 'Regional Hawk-Dove Score');
  await importOptional(GOVERNOR_ORIGIN_FILE, 'FED_GOV_ORIGIN_SCORE', 'Governor Origin Score');
  await importOptional(POLITICAL_TILT_FILE, 'FED_POLITICAL_TILT', 'Political Appointment Tilt');
  await importOptional(THINK_TANK_FILE, 'FED_THINK_TANK_DENSITY', 'Think Tank Network Density');
  await importOptional(REVOLVING_DOOR_FILE, 'FED_REVOLVING_DOOR', 'Revolving Door Intensity');
  await importOptional(NYFED_LINKAGE_FILE, 'NYFED_WALLSTREET_LINKAGE', 'NY Fed Wall Street Linkage');
  await importOptional(SECTOR_MEETING_FILE, 'FED_SECTOR_MEETING_CONCENTRATION', 'Sector Meeting Concentration');
  await importOptional(PRIMARY_DEALER_FILE, 'FED_PRIMARY_DEALER_INFLUENCE', 'Primary Dealer Influence');

  console.log('Fed power balance import completed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

/**
 * Compares the live schema fingerprint against the baseline committed in
 * tests/fixtures/schema-baseline.json. Exits 1 (and prints diff) if there
 * are MISSING fields the code depends on, or breaking shape changes.
 *
 * NEW fields are reported as warnings (not failures) — PNCP often adds
 * fields and our Zod schemas use .passthrough() so it's safe.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

interface EndpointSnapshot {
  fields: string[];
  sampleCount: number;
}
type Snapshot = Record<string, EndpointSnapshot>;

const BASELINE_PATH = resolve('tests/fixtures/schema-baseline.json');

function loadBaseline(): Snapshot {
  try {
    return JSON.parse(readFileSync(BASELINE_PATH, 'utf-8')) as Snapshot;
  } catch {
    return {};
  }
}

function captureLive(): Snapshot {
  const result = spawnSync('npx', ['tsx', 'scripts/schema-snapshot.ts'], {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  if (result.status !== 0) {
    throw new Error(`Snapshot script exited ${result.status}`);
  }
  return JSON.parse(result.stdout) as Snapshot;
}

function diffFields(
  baseline: string[],
  live: string[],
): { missing: string[]; added: string[] } {
  const baseSet = new Set(baseline);
  const liveSet = new Set(live);
  return {
    missing: baseline.filter((f) => !liveSet.has(f)),
    added: live.filter((f) => !baseSet.has(f) && !f.startsWith('__ERROR__')),
  };
}

function main(): void {
  const baseline = loadBaseline();
  const live = captureLive();

  const endpoints = Array.from(
    new Set([...Object.keys(baseline), ...Object.keys(live)]),
  ).sort();

  let hasBreaking = false;
  let hasNew = false;

  for (const ep of endpoints) {
    const baseFields = baseline[ep]?.fields ?? [];
    const liveFields = live[ep]?.fields ?? [];

    if (liveFields.length === 1 && liveFields[0]!.startsWith('__ERROR__')) {
      console.warn(`⚠ ${ep}: ${liveFields[0]} (skipping)`);
      continue;
    }

    if (baseFields.length === 0) {
      console.warn(`⚠ ${ep}: no baseline yet — captured ${liveFields.length} fields`);
      continue;
    }

    const { missing, added } = diffFields(baseFields, liveFields);

    if (missing.length === 0 && added.length === 0) {
      console.log(`✓ ${ep} — schema unchanged (${liveFields.length} fields)`);
      continue;
    }

    if (missing.length > 0) {
      hasBreaking = true;
      console.error(`✗ ${ep} — MISSING fields (BREAKING):`);
      for (const f of missing) console.error(`     - ${f}`);
    }

    if (added.length > 0) {
      hasNew = true;
      console.warn(`ℹ ${ep} — new fields (informational):`);
      for (const f of added) console.warn(`     + ${f}`);
    }
  }

  if (hasBreaking) {
    console.error('');
    console.error('BREAKING schema changes detected. Review and update adapters / schemas.');
    process.exit(1);
  }

  if (hasNew) {
    console.log('');
    console.log('No breaking changes. New fields can be added to schemas opportunistically.');
    console.log('To accept: re-run schema:snapshot and commit the new baseline.');
  }
}

main();

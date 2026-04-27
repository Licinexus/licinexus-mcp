/**
 * Measures per-endpoint latency against the live PNCP and BrasilAPI.
 * Runs each endpoint N times, computes p50/p95/min/max, outputs JSON.
 *
 * Used by .github/workflows/latency.yml (weekly).
 *
 * Output schema:
 * {
 *   "timestamp": "2026-04-27T15:00:00Z",
 *   "samples": 3,
 *   "results": [
 *     { "endpoint": "...", "p50_ms": 450, "p95_ms": 1200, "ok": 3, "failed": 0 }
 *   ]
 * }
 */
import {
  getOrgao,
  listAtas,
  listContratacoes,
  listContratos,
  listPcaAtualizacao,
} from '../src/adapters/pncp.js';
import { getCnpjData } from '../src/adapters/cnpj.js';
import { defaultDateRange } from '../src/utils/dates.js';
import { cache } from '../src/cache/memory.js';

const SAMPLES = Number(process.env.LATENCY_SAMPLES ?? 3);

interface Probe {
  name: string;
  fn: () => Promise<unknown>;
}

interface Result {
  endpoint: string;
  p50_ms: number | null;
  p95_ms: number | null;
  min_ms: number | null;
  max_ms: number | null;
  ok: number;
  failed: number;
}

function pct(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((sorted.length * p) / 100));
  return Math.round(sorted[idx]!);
}

async function measure(probe: Probe): Promise<Result> {
  const timings: number[] = [];
  let failed = 0;

  for (let i = 0; i < SAMPLES; i++) {
    cache.clear();
    const start = Date.now();
    try {
      await probe.fn();
      timings.push(Date.now() - start);
    } catch {
      failed += 1;
    }
  }

  const ok = timings.length;
  return {
    endpoint: probe.name,
    p50_ms: ok > 0 ? pct(timings, 50) : null,
    p95_ms: ok > 0 ? pct(timings, 95) : null,
    min_ms: ok > 0 ? Math.min(...timings) : null,
    max_ms: ok > 0 ? Math.max(...timings) : null,
    ok,
    failed,
  };
}

async function main(): Promise<void> {
  const range = defaultDateRange(7);
  const range90 = defaultDateRange(90);
  const range30 = defaultDateRange(30);

  const probes: Probe[] = [
    {
      name: 'pncp.contratacoes.publicacao',
      fn: () =>
        listContratacoes({
          dataInicial: range.dataInicial,
          dataFinal: range.dataFinal,
          codigoModalidadeContratacao: 6,
          tamanhoPagina: 10,
        }),
    },
    {
      name: 'pncp.contratos',
      fn: () =>
        listContratos({
          dataInicial: range.dataInicial,
          dataFinal: range.dataFinal,
          tamanhoPagina: 10,
        }),
    },
    {
      name: 'pncp.atas',
      fn: () =>
        listAtas({
          dataInicial: range90.dataInicial,
          dataFinal: range90.dataFinal,
          tamanhoPagina: 10,
        }),
    },
    {
      name: 'pncp.orgao',
      fn: () => getOrgao('00394544000185'),
    },
    {
      name: 'pncp.pca.atualizacao',
      fn: () =>
        listPcaAtualizacao({
          dataInicio: range30.dataInicial,
          dataFim: range30.dataFinal,
          codigoClassificacaoSuperior: '01',
          tamanhoPagina: 10,
        }),
    },
    {
      name: 'brasilapi.cnpj',
      fn: () => getCnpjData('00000000000191'),
    },
  ];

  const results: Result[] = [];
  for (const p of probes) {
    process.stderr.write(`Measuring ${p.name}...\n`);
    results.push(await measure(p));
  }

  const out = {
    timestamp: new Date().toISOString(),
    samples: SAMPLES,
    results,
  };
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

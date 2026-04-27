/**
 * Captures the set of top-level field names returned by representative
 * PNCP / BrasilAPI endpoints. Used by:
 *   - schema-check.ts (daily diff against baseline)
 *   - manual baseline updates: `npm run schema:snapshot > tests/fixtures/schema-baseline.json`
 *
 * The "schema fingerprint" is intentionally just field names — full type
 * checking would be too brittle. We catch the cases that matter:
 * fields removed, fields renamed, completely new top-level keys.
 */
import {
  getOrgao,
  listAtas,
  listContratacaoItens,
  listContratacoes,
  listContratos,
  listPcaAtualizacao,
} from '../src/adapters/pncp.js';
import { getCnpjData } from '../src/adapters/cnpj.js';
import { defaultDateRange } from '../src/utils/dates.js';

interface Snapshot {
  endpoint: string;
  fields: string[];
  sampleCount: number;
}

function fieldNames(obj: unknown): string[] {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    return Object.keys(obj as Record<string, unknown>).sort();
  }
  return [];
}

function unionFields(items: unknown[]): string[] {
  const set = new Set<string>();
  for (const item of items.slice(0, 5)) {
    for (const k of fieldNames(item)) set.add(k);
  }
  return Array.from(set).sort();
}

async function snap(
  endpoint: string,
  fn: () => Promise<{ fields: string[]; sampleCount: number }>,
): Promise<Snapshot> {
  try {
    const result = await fn();
    return { endpoint, ...result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { endpoint, fields: [`__ERROR__: ${msg}`], sampleCount: 0 };
  }
}

async function main(): Promise<void> {
  const range = defaultDateRange(7);
  const range90 = defaultDateRange(90);
  const range30 = defaultDateRange(30);

  const snapshots: Snapshot[] = [];

  snapshots.push(
    await snap('pncp.contratacoes.publicacao', async () => {
      const page = await listContratacoes({
        dataInicial: range.dataInicial,
        dataFinal: range.dataFinal,
        codigoModalidadeContratacao: 6,
        tamanhoPagina: 10,
      });
      return { fields: unionFields(page.data), sampleCount: page.data.length };
    }),
  );

  snapshots.push(
    await snap('pncp.contratacao.itens', async () => {
      const page = await listContratacoes({
        dataInicial: range.dataInicial,
        dataFinal: range.dataFinal,
        codigoModalidadeContratacao: 6,
        tamanhoPagina: 10,
      });
      const c = page.data[0];
      if (!c?.orgaoEntidade?.cnpj) return { fields: [], sampleCount: 0 };
      const itens = await listContratacaoItens(
        c.orgaoEntidade.cnpj,
        c.anoCompra,
        c.sequencialCompra,
      );
      return { fields: unionFields(itens), sampleCount: itens.length };
    }),
  );

  snapshots.push(
    await snap('pncp.contratos', async () => {
      const page = await listContratos({
        dataInicial: range.dataInicial,
        dataFinal: range.dataFinal,
        tamanhoPagina: 10,
      });
      return { fields: unionFields(page.data), sampleCount: page.data.length };
    }),
  );

  snapshots.push(
    await snap('pncp.atas', async () => {
      const page = await listAtas({
        dataInicial: range90.dataInicial,
        dataFinal: range90.dataFinal,
        tamanhoPagina: 10,
      });
      return { fields: unionFields(page.data), sampleCount: page.data.length };
    }),
  );

  snapshots.push(
    await snap('pncp.orgao', async () => {
      const o = await getOrgao('00394544000185');
      return { fields: fieldNames(o), sampleCount: 1 };
    }),
  );

  snapshots.push(
    await snap('pncp.pca.atualizacao', async () => {
      const page = await listPcaAtualizacao({
        dataInicio: range30.dataInicial,
        dataFim: range30.dataFinal,
        codigoClassificacaoSuperior: '01',
        tamanhoPagina: 10,
      });
      return { fields: unionFields(page.data), sampleCount: page.data.length };
    }),
  );

  snapshots.push(
    await snap('brasilapi.cnpj', async () => {
      const data = await getCnpjData('00000000000191');
      const { _provider: _p, ...rest } = data as Record<string, unknown>;
      return { fields: fieldNames(rest), sampleCount: 1 };
    }),
  );

  const out = snapshots.reduce<Record<string, { fields: string[]; sampleCount: number }>>(
    (acc, s) => {
      acc[s.endpoint] = { fields: s.fields, sampleCount: s.sampleCount };
      return acc;
    },
    {},
  );

  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

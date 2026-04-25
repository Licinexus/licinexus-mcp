/**
 * Smoke test: hits the real PNCP and BrasilAPI endpoints to validate adapters.
 * Run: `npm run smoke`
 */
import {
  getAta,
  getContratacao,
  getContrato,
  getOrgao,
  listAtaArquivos,
  listAtaItens,
  listAtas,
  listContratacaoArquivos,
  listContratacaoItens,
  listContratacoes,
  listContratoInstrumentos,
  listContratos,
  listContratoTermos,
  listItemResultados,
  listPcaAtualizacao,
} from '../src/adapters/pncp.js';
import { getCnpjData } from '../src/adapters/cnpj.js';
import { defaultDateRange } from '../src/utils/dates.js';

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
  ms: number;
}

const results: CheckResult[] = [];

async function check(name: string, fn: () => Promise<string>): Promise<void> {
  const start = Date.now();
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail, ms: Date.now() - start });
    console.log(`✓ ${name} (${Date.now() - start}ms) — ${detail}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push({ name, ok: false, detail: msg, ms: Date.now() - start });
    console.error(`✗ ${name} (${Date.now() - start}ms) — ${msg}`);
  }
}

async function main(): Promise<void> {
  console.log('🚦 Licinexus MCP — Smoke Test against real PNCP + BrasilAPI');
  console.log('');

  const { dataInicial, dataFinal } = defaultDateRange(7);

  // Will be filled by first search to chain dependent calls.
  let firstCompra: { cnpj: string; ano: number; seq: number; numItem?: number } | null = null;
  let firstContrato: { cnpj: string; ano: number; seq: number } | null = null;
  let firstAta: { cnpj: string; ano: number; seq: number; seqAta: number } | null = null;

  await check('listContratacoes (modalidade=6, last 7d)', async () => {
    const page = await listContratacoes({
      dataInicial,
      dataFinal,
      codigoModalidadeContratacao: 6,
      tamanhoPagina: 10,
    });
    if (page.data.length > 0) {
      const c = page.data[0]!;
      const cnpj = c.orgaoEntidade?.cnpj;
      if (cnpj) {
        firstCompra = { cnpj, ano: c.anoCompra, seq: c.sequencialCompra };
      }
    }
    return `${page.data.length} compras retornadas (totalPncp=${page.totalRegistros ?? '?'})`;
  });

  await check('getContratacao (first result)', async () => {
    if (!firstCompra) return 'skipped (no first compra)';
    const c = await getContratacao(firstCompra.cnpj, firstCompra.ano, firstCompra.seq);
    return `objeto: ${(c.objetoCompra ?? '').slice(0, 50)}…`;
  });

  await check('listContratacaoItens', async () => {
    if (!firstCompra) return 'skipped';
    const items = await listContratacaoItens(
      firstCompra.cnpj,
      firstCompra.ano,
      firstCompra.seq,
    );
    if (items.length > 0) firstCompra.numItem = items[0]!.numeroItem;
    return `${items.length} itens`;
  });

  await check('listItemResultados', async () => {
    if (!firstCompra || !firstCompra.numItem) return 'skipped (no item)';
    const r = await listItemResultados(
      firstCompra.cnpj,
      firstCompra.ano,
      firstCompra.seq,
      firstCompra.numItem,
    );
    return `${r.length} resultados`;
  });

  await check('listContratacaoArquivos', async () => {
    if (!firstCompra) return 'skipped';
    const files = await listContratacaoArquivos(
      firstCompra.cnpj,
      firstCompra.ano,
      firstCompra.seq,
    );
    return `${files.length} arquivos`;
  });

  await check('listContratos (last 7d)', async () => {
    const page = await listContratos({ dataInicial, dataFinal, tamanhoPagina: 10 });
    if (page.data.length > 0) {
      const c = page.data[0]!;
      const cnpj = c.orgaoEntidade?.cnpj;
      if (cnpj) {
        firstContrato = { cnpj, ano: c.anoContrato, seq: c.sequencialContrato };
      }
    }
    return `${page.data.length} contratos retornados`;
  });

  await check('getContrato', async () => {
    if (!firstContrato) return 'skipped';
    const c = await getContrato(firstContrato.cnpj, firstContrato.ano, firstContrato.seq);
    return `objeto: ${(c.objetoContrato ?? '').slice(0, 50)}…`;
  });

  await check('listContratoTermos', async () => {
    if (!firstContrato) return 'skipped';
    const t = await listContratoTermos(
      firstContrato.cnpj,
      firstContrato.ano,
      firstContrato.seq,
    );
    return `${t.length} termos`;
  });

  await check('listContratoInstrumentos', async () => {
    if (!firstContrato) return 'skipped';
    const i = await listContratoInstrumentos(
      firstContrato.cnpj,
      firstContrato.ano,
      firstContrato.seq,
    );
    return `${i.length} instrumentos`;
  });

  await check('listAtas (last 30d)', async () => {
    const range = defaultDateRange(30);
    const page = await listAtas({ ...range, tamanhoPagina: 10 });
    if (page.data.length > 0) {
      const a = page.data[0]!;
      const cnpj = a.orgaoEntidade?.cnpj;
      if (cnpj && a.numeroControlePNCPCompra) {
        const m = a.numeroControlePNCPCompra.match(/^\d{14}-\d-(\d+)\/(\d{4})$/);
        if (m) {
          firstAta = {
            cnpj,
            ano: Number(m[2]),
            seq: Number(m[1]),
            seqAta: a.sequencialAta,
          };
        }
      }
    }
    return `${page.data.length} atas retornadas`;
  });

  await check('getAta + listAtaItens', async () => {
    if (!firstAta) return 'skipped (no ata)';
    const [ata, itens] = await Promise.all([
      getAta(firstAta.cnpj, firstAta.ano, firstAta.seq, firstAta.seqAta),
      listAtaItens(firstAta.cnpj, firstAta.ano, firstAta.seq, firstAta.seqAta).catch(
        () => [],
      ),
    ]);
    return `ata vigência ${ata.dataVigenciaFim ?? '?'}, ${itens.length} itens`;
  });

  await check('listAtaArquivos', async () => {
    if (!firstAta) return 'skipped';
    const files = await listAtaArquivos(
      firstAta.cnpj,
      firstAta.ano,
      firstAta.seq,
      firstAta.seqAta,
    );
    return `${files.length} arquivos`;
  });

  await check('getOrgao (Min. Saúde)', async () => {
    const o = await getOrgao('00394544000185');
    return `${o.razaoSocial ?? '?'}`;
  });

  await check('listPcaAtualizacao (last 30d, material)', async () => {
    const r = defaultDateRange(30);
    const page = await listPcaAtualizacao({
      dataInicio: r.dataInicial,
      dataFim: r.dataFinal,
      codigoClassificacaoSuperior: '01',
      tamanhoPagina: 10,
    });
    return `${page.data.length} PCAs (totalPncp=${page.totalRegistros ?? '?'})`;
  });

  await check('getCnpjData via BrasilAPI (sample)', async () => {
    const data = await getCnpjData('00000000000191');
    return `${data.razao_social ?? '?'} (${data._provider})`;
  });

  console.log('');
  console.log('────────────────────────────────────────');
  const ok = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok).length;
  console.log(`Result: ${ok} ok / ${fail} fail / ${results.length} total`);
  console.log('────────────────────────────────────────');

  if (fail > 0) {
    console.log('');
    console.log('Failures:');
    for (const r of results.filter((x) => !x.ok)) {
      console.log(`  ✗ ${r.name}: ${r.detail}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});

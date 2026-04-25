import { z } from 'zod';
import { listContratos, PncpError } from '../adapters/pncp.js';
import { defaultDateRange, isValidPncpDate } from '../utils/dates.js';
import type { Contrato } from '../schemas/pncp.js';
import type { ToolDef } from './types.js';
import { errorResult, jsonResult } from './types.js';

const ArgsSchema = z.object({
  dataInicial: z.string().refine(isValidPncpDate, 'Format must be YYYYMMDD').optional(),
  dataFinal: z.string().refine(isValidPncpDate, 'Format must be YYYYMMDD').optional(),
  cnpjOrgao: z
    .string()
    .regex(/^\d{14}$/, 'CNPJ must be 14 digits')
    .optional(),
  cnpjFornecedor: z
    .string()
    .regex(/^\d{14}$/, 'CNPJ must be 14 digits')
    .optional(),
  palavraChave: z.string().min(2).optional(),
  valorMinimo: z.number().nonnegative().optional(),
  valorMaximo: z.number().nonnegative().optional(),
  pagina: z.number().int().min(1).default(1),
  tamanhoPagina: z.number().int().min(1).max(50).default(20),
});

type Args = z.infer<typeof ArgsSchema>;

function matchesKeyword(c: Contrato, kw: string): boolean {
  const lower = kw.toLowerCase();
  const haystack = [
    c.objetoContrato,
    c.informacaoComplementar,
    c.orgaoEntidade?.razaoSocial,
    c.fornecedor?.razaoSocial,
    c.fornecedor?.nome,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(lower);
}

function matchesValor(c: Contrato, args: Args): boolean {
  const v = c.valorGlobal ?? c.valorInicial;
  if (v == null) return args.valorMinimo == null && args.valorMaximo == null;
  if (args.valorMinimo != null && v < args.valorMinimo) return false;
  if (args.valorMaximo != null && v > args.valorMaximo) return false;
  return true;
}

function summarize(c: Contrato) {
  return {
    numeroControlePNCP: c.numeroControlePNCP,
    objeto: c.objetoContrato,
    valorInicial: c.valorInicial,
    valorGlobal: c.valorGlobal,
    fornecedor: c.fornecedor?.razaoSocial ?? c.fornecedor?.nome,
    cnpjFornecedor: c.fornecedor?.cnpj ?? c.fornecedor?.ni,
    orgao: c.orgaoEntidade?.razaoSocial,
    cnpjOrgao: c.orgaoEntidade?.cnpj,
    uf: c.unidadeOrgao?.ufSigla,
    municipio: c.unidadeOrgao?.municipioNome,
    dataAssinatura: c.dataAssinatura,
    vigenciaInicio: c.dataVigenciaInicio,
    vigenciaFim: c.dataVigenciaFim,
  };
}

export const searchContratos: ToolDef = {
  definition: {
    name: 'search_contratos',
    description:
      'Search public procurement contracts (contratos) on PNCP. Useful for analyzing market history, supplier behavior, and agency spending patterns. Defaults to last 30 days when no date range is provided.',
    inputSchema: {
      type: 'object',
      properties: {
        dataInicial: { type: 'string', description: 'Start date YYYYMMDD' },
        dataFinal: { type: 'string', description: 'End date YYYYMMDD' },
        cnpjOrgao: { type: 'string', description: 'Filter by procuring agency CNPJ' },
        cnpjFornecedor: { type: 'string', description: 'Filter by supplier CNPJ' },
        palavraChave: {
          type: 'string',
          description: 'Keyword filter on objetoContrato (client-side).',
        },
        valorMinimo: { type: 'number' },
        valorMaximo: { type: 'number' },
        pagina: { type: 'integer', minimum: 1, default: 1 },
        tamanhoPagina: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
      },
    },
  },

  async handler(rawArgs) {
    const parse = ArgsSchema.safeParse(rawArgs ?? {});
    if (!parse.success) return errorResult(`Invalid arguments: ${parse.error.message}`);
    const args = parse.data;
    const range =
      !args.dataInicial || !args.dataFinal
        ? defaultDateRange(30)
        : { dataInicial: args.dataInicial, dataFinal: args.dataFinal };

    try {
      const page = await listContratos({
        dataInicial: range.dataInicial,
        dataFinal: range.dataFinal,
        cnpjOrgao: args.cnpjOrgao,
        cnpjFornecedor: args.cnpjFornecedor,
        pagina: args.pagina,
        tamanhoPagina: args.tamanhoPagina,
      });
      const filtered = page.data.filter((c) => {
        if (args.palavraChave && !matchesKeyword(c, args.palavraChave)) return false;
        if (!matchesValor(c, args)) return false;
        return true;
      });
      return jsonResult({
        meta: {
          dataInicial: range.dataInicial,
          dataFinal: range.dataFinal,
          pagina: args.pagina,
          totalRetornados: filtered.length,
          totalAntesFiltros: page.data.length,
          totalPncp: page.totalRegistros,
        },
        results: filtered.map(summarize),
      });
    } catch (err) {
      const msg = err instanceof PncpError ? err.message : String(err);
      return errorResult(`Failed to search contratos: ${msg}`);
    }
  },
};

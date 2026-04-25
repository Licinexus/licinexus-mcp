import { z } from 'zod';
import { listContratacoes, PncpError } from '../adapters/pncp.js';
import { defaultDateRange, isValidPncpDate } from '../utils/dates.js';
import { DEFAULT_MODALIDADES, MODALIDADE_IDS, MODALIDADES_PNCP } from '../schemas/modalidades.js';
import type { Contratacao } from '../schemas/pncp.js';
import type { ToolDef } from './types.js';
import { errorResult, jsonResult } from './types.js';

const ArgsSchema = z.object({
  dataInicial: z.string().refine(isValidPncpDate, 'Format must be YYYYMMDD').optional(),
  dataFinal: z.string().refine(isValidPncpDate, 'Format must be YYYYMMDD').optional(),
  modalidades: z.array(z.number().int()).optional(),
  uf: z.string().length(2).toUpperCase().optional(),
  codigoMunicipioIbge: z.string().optional(),
  cnpjOrgao: z
    .string()
    .regex(/^\d{14}$/, 'CNPJ must be 14 digits, no punctuation')
    .optional(),
  palavraChave: z.string().min(2).optional(),
  valorMinimo: z.number().nonnegative().optional(),
  valorMaximo: z.number().nonnegative().optional(),
  pagina: z.number().int().min(1).default(1),
  tamanhoPagina: z.number().int().min(10).max(50).default(20),
});

type Args = z.infer<typeof ArgsSchema>;

function matchesKeyword(c: Contratacao, kw: string): boolean {
  const lower = kw.toLowerCase();
  const haystack = [
    c.objetoCompra,
    c.informacaoComplementar,
    c.orgaoEntidade?.razaoSocial,
    c.unidadeOrgao?.nomeUnidade,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(lower);
}

function matchesValor(c: Contratacao, args: Args): boolean {
  const v = c.valorTotalEstimado ?? c.valorTotalHomologado;
  if (v == null) return args.valorMinimo == null && args.valorMaximo == null;
  if (args.valorMinimo != null && v < args.valorMinimo) return false;
  if (args.valorMaximo != null && v > args.valorMaximo) return false;
  return true;
}

function summarize(c: Contratacao) {
  return {
    numeroControlePNCP: c.numeroControlePNCP,
    modalidade: c.modalidadeNome,
    objeto: c.objetoCompra,
    valorEstimado: c.valorTotalEstimado,
    valorHomologado: c.valorTotalHomologado,
    situacao: c.situacaoCompraNome,
    orgao: c.orgaoEntidade?.razaoSocial,
    cnpjOrgao: c.orgaoEntidade?.cnpj,
    uf: c.unidadeOrgao?.ufSigla,
    municipio: c.unidadeOrgao?.municipioNome,
    dataPublicacao: c.dataPublicacaoPncp,
    dataAbertura: c.dataAberturaProposta,
    dataEncerramento: c.dataEncerramentoProposta,
    linkOrigem: c.linkSistemaOrigem,
  };
}

export const searchLicitacoes: ToolDef = {
  definition: {
    name: 'search_licitacoes',
    description: [
      'Search Brazilian public procurement bids (licitações) on PNCP.',
      '',
      'PNCP requires a date range and at least one modality code per query. If you do not specify, defaults are: last 7 days and modalities [6, 8, 9] (Pregão Eletrônico, Dispensa, Inexigibilidade — most common).',
      '',
      'Modality codes:',
      ...MODALIDADES_PNCP.map((m) => `  ${m.id} = ${m.nome}`),
      '',
      'Filters palavraChave, valorMinimo, valorMaximo are applied client-side over the page returned by PNCP.',
    ].join('\n'),
    inputSchema: {
      type: 'object',
      properties: {
        dataInicial: {
          type: 'string',
          description: 'Start date in YYYYMMDD format. Default: 7 days ago.',
        },
        dataFinal: {
          type: 'string',
          description: 'End date in YYYYMMDD format. Default: today.',
        },
        modalidades: {
          type: 'array',
          items: { type: 'integer', enum: MODALIDADE_IDS },
          description: 'List of modality codes. Default: [6, 8, 9].',
        },
        uf: {
          type: 'string',
          description: 'Two-letter state code (e.g. SP, RJ).',
        },
        codigoMunicipioIbge: {
          type: 'string',
          description: 'IBGE municipality code (7 digits).',
        },
        cnpjOrgao: {
          type: 'string',
          description: 'Filter by procuring agency CNPJ (14 digits, no punctuation).',
        },
        palavraChave: {
          type: 'string',
          description: 'Keyword to filter on objetoCompra (case-insensitive substring match).',
        },
        valorMinimo: { type: 'number', description: 'Minimum estimated value in BRL.' },
        valorMaximo: { type: 'number', description: 'Maximum estimated value in BRL.' },
        pagina: { type: 'integer', minimum: 1, default: 1 },
        tamanhoPagina: { type: 'integer', minimum: 10, maximum: 50, default: 20 },
      },
    },
  },

  async handler(rawArgs) {
    const parse = ArgsSchema.safeParse(rawArgs ?? {});
    if (!parse.success) {
      return errorResult(`Invalid arguments: ${parse.error.message}`);
    }
    const args = parse.data;

    const range =
      !args.dataInicial || !args.dataFinal
        ? defaultDateRange(7)
        : { dataInicial: args.dataInicial, dataFinal: args.dataFinal };
    const modalidades = args.modalidades ?? DEFAULT_MODALIDADES;

    try {
      const pages = await Promise.all(
        modalidades.map((m) =>
          listContratacoes({
            dataInicial: range.dataInicial,
            dataFinal: range.dataFinal,
            codigoModalidadeContratacao: m,
            uf: args.uf,
            codigoMunicipioIbge: args.codigoMunicipioIbge,
            cnpj: args.cnpjOrgao,
            pagina: args.pagina,
            tamanhoPagina: args.tamanhoPagina,
          }),
        ),
      );

      const all = pages.flatMap((p) => p.data);
      const filtered = all.filter((c) => {
        if (args.palavraChave && !matchesKeyword(c, args.palavraChave)) return false;
        if (!matchesValor(c, args)) return false;
        return true;
      });

      const totalRegistros = pages.reduce((sum, p) => sum + (p.totalRegistros ?? 0), 0);

      return jsonResult({
        meta: {
          dataInicial: range.dataInicial,
          dataFinal: range.dataFinal,
          modalidades,
          pagina: args.pagina,
          tamanhoPagina: args.tamanhoPagina,
          totalRetornados: filtered.length,
          totalAntesFiltros: all.length,
          totalPncp: totalRegistros,
        },
        results: filtered.map(summarize),
      });
    } catch (err) {
      const msg = err instanceof PncpError ? err.message : String(err);
      return errorResult(`Failed to search licitações: ${msg}`);
    }
  },
};

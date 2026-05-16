import { z } from 'zod';
import { listAtas, PncpError } from '../adapters/pncp.js';
import {
  defaultDateRange,
  isValidPncpDate,
  validatePncpDateRange,
  PNCP_MAX_DATE_RANGE_DAYS,
} from '../utils/dates.js';
import { EsferaSchema, ESFERA_VALUES, matchesEsfera } from '../utils/esfera.js';
import type { Ata } from '../schemas/pncp.js';
import type { ToolDef } from './types.js';
import { errorResult, jsonResult } from './types.js';

const ArgsSchema = z.object({
  dataInicial: z.string().refine(isValidPncpDate, 'Format must be YYYYMMDD').optional(),
  dataFinal: z.string().refine(isValidPncpDate, 'Format must be YYYYMMDD').optional(),
  cnpjOrgao: z
    .string()
    .regex(/^\d{14}$/, 'CNPJ must be 14 digits')
    .optional(),
  esfera: EsferaSchema.optional(),
  somenteVigentes: z.boolean().default(true),
  palavraChave: z.string().min(2).optional(),
  pagina: z.number().int().min(1).default(1),
  tamanhoPagina: z.number().int().min(10).max(50).default(20),
});

function isVigente(a: Ata, today: Date = new Date()): boolean {
  if (a.cancelado === true || a.cancelada === true) return false;
  const fim = a.vigenciaFim ?? a.dataVigenciaFim;
  if (!fim) return true;
  return new Date(fim) >= today;
}

function summarize(a: Ata) {
  return {
    numeroControlePNCPAta: a.numeroControlePNCPAta ?? a.numeroControlePNCP,
    numeroAta: a.numeroAtaRegistroPreco,
    objeto: a.objetoContratacao,
    valorEstimado: a.valorTotalEstimado,
    valorHomologado: a.valorTotalHomologado,
    orgao: a.orgaoEntidade?.razaoSocial,
    cnpjOrgao: a.orgaoEntidade?.cnpj,
    uf: a.unidadeOrgao?.ufSigla,
    municipio: a.unidadeOrgao?.municipioNome,
    dataAssinatura: a.dataAssinatura,
    vigenciaInicio: a.vigenciaInicio ?? a.dataVigenciaInicio,
    vigenciaFim: a.vigenciaFim ?? a.dataVigenciaFim,
    cancelado: a.cancelado ?? a.cancelada,
    situacao: a.situacaoAtaNome,
  };
}

export const searchAtasRp: ToolDef = {
  definition: {
    name: 'search_atas_rp',
    description: `Search Atas de Registro de Preço (price-registry agreements) on PNCP. ARPs are pre-negotiated agreements that any compatible agency can use within the validity period — finding ones still in vigor with available balance is a key business opportunity. Defaults: last 90 days, only active (somenteVigentes=true). Maximum date range per query: ${PNCP_MAX_DATE_RANGE_DAYS} days (PNCP limit); wider windows return HTTP 422.`,
    inputSchema: {
      type: 'object',
      properties: {
        dataInicial: { type: 'string', description: 'Start date YYYYMMDD' },
        dataFinal: { type: 'string', description: 'End date YYYYMMDD' },
        cnpjOrgao: { type: 'string', description: 'Filter by procuring agency CNPJ' },
        esfera: {
          type: 'string',
          enum: [...ESFERA_VALUES],
          description:
            "Filter by government sphere: 'federal', 'estadual', 'municipal', or 'distrital'.",
        },
        somenteVigentes: {
          type: 'boolean',
          default: true,
          description:
            'Only include ARPs whose vigência has not expired and that are not cancelled.',
        },
        palavraChave: { type: 'string', description: 'Keyword filter on objetoContratacao' },
        pagina: { type: 'integer', minimum: 1, default: 1 },
        tamanhoPagina: { type: 'integer', minimum: 10, maximum: 50, default: 20 },
      },
    },
  },

  async handler(rawArgs) {
    const parse = ArgsSchema.safeParse(rawArgs ?? {});
    if (!parse.success) return errorResult(`Invalid arguments: ${parse.error.message}`);
    const args = parse.data;
    const range =
      !args.dataInicial || !args.dataFinal
        ? defaultDateRange(90)
        : { dataInicial: args.dataInicial, dataFinal: args.dataFinal };

    const validation = validatePncpDateRange(range.dataInicial, range.dataFinal);
    if (!validation.ok) {
      return errorResult(validation.reason);
    }

    try {
      const page = await listAtas({
        dataInicial: range.dataInicial,
        dataFinal: range.dataFinal,
        cnpjOrgao: args.cnpjOrgao,
        pagina: args.pagina,
        tamanhoPagina: args.tamanhoPagina,
      });
      const today = new Date();
      const filtered = page.data.filter((a) => {
        if (!matchesEsfera(a, args.esfera)) return false;
        if (args.somenteVigentes && !isVigente(a, today)) return false;
        if (args.palavraChave) {
          const lower = args.palavraChave.toLowerCase();
          if (!(a.objetoContratacao ?? '').toLowerCase().includes(lower)) return false;
        }
        return true;
      });
      return jsonResult({
        meta: {
          dataInicial: range.dataInicial,
          dataFinal: range.dataFinal,
          somenteVigentes: args.somenteVigentes,
          totalRetornados: filtered.length,
          totalAntesFiltros: page.data.length,
          totalPncp: page.totalRegistros,
        },
        results: filtered.map(summarize),
      });
    } catch (err) {
      const msg = err instanceof PncpError ? err.message : String(err);
      return errorResult(`Failed to search atas RP: ${msg}`);
    }
  },
};

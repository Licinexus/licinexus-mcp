import { z } from 'zod';
import { listPcaAtualizacao, PncpError } from '../adapters/pncp.js';
import {
  defaultDateRange,
  isValidPncpDate,
  validatePncpDateRange,
  PNCP_MAX_DATE_RANGE_DAYS,
} from '../utils/dates.js';
import type { ToolDef } from './types.js';
import { errorResult, jsonResult } from './types.js';
import { t } from '../utils/i18n.js';

const ArgsSchema = z.object({
  dataInicio: z.string().refine(isValidPncpDate, 'Format must be YYYYMMDD').optional(),
  dataFim: z.string().refine(isValidPncpDate, 'Format must be YYYYMMDD').optional(),
  classificacao: z.enum(['material', 'servico']).default('material'),
  pagina: z.number().int().min(1).default(1),
  tamanhoPagina: z.number().int().min(10).max(50).default(20),
});

export const searchPca: ToolDef = {
  definition: {
    name: 'search_pca',
    description: `Search recently published/updated Plano de Contratação Anual (PCA) entries — what public agencies INTEND to buy. Returns PCA entries (one per agency unit) with their items embedded. Filter by classification: 'material' or 'servico'. Defaults: last 30 days, classification 'material'. Per Lei 14.133. Maximum date range per query: ${PNCP_MAX_DATE_RANGE_DAYS} days (PNCP limit).`,
    inputSchema: {
      type: 'object',
      properties: {
        dataInicio: {
          type: 'string',
          description: 'Start date YYYYMMDD. Default: 30 days ago.',
        },
        dataFim: { type: 'string', description: 'End date YYYYMMDD. Default: today.' },
        classificacao: {
          type: 'string',
          enum: ['material', 'servico'],
          default: 'material',
          description:
            'Top-level classification: material (codigoClassificacaoSuperior=01) or servico (=02).',
        },
        pagina: { type: 'integer', minimum: 1, default: 1 },
        tamanhoPagina: { type: 'integer', minimum: 10, maximum: 50, default: 20 },
      },
    },
  },

  async handler(rawArgs) {
    const parse = ArgsSchema.safeParse(rawArgs ?? {});
    if (!parse.success)
      return errorResult(t('error.invalid_arguments', { msg: parse.error.message }));
    const args = parse.data;
    const range =
      !args.dataInicio || !args.dataFim
        ? (() => {
            const r = defaultDateRange(30);
            return { dataInicio: r.dataInicial, dataFim: r.dataFinal };
          })()
        : { dataInicio: args.dataInicio, dataFim: args.dataFim };

    const validation = validatePncpDateRange(range.dataInicio, range.dataFim);
    if (!validation.ok) {
      return errorResult(validation.reason);
    }

    try {
      const page = await listPcaAtualizacao({
        dataInicio: range.dataInicio,
        dataFim: range.dataFim,
        codigoClassificacaoSuperior: args.classificacao === 'servico' ? '02' : '01',
        pagina: args.pagina,
        tamanhoPagina: args.tamanhoPagina,
      });
      return jsonResult({
        meta: {
          dataInicio: range.dataInicio,
          dataFim: range.dataFim,
          classificacao: args.classificacao,
          pagina: args.pagina,
          totalRetornados: page.data.length,
          totalPncp: page.totalRegistros,
          totalPaginas: page.totalPaginas,
        },
        results: page.data,
      });
    } catch (err) {
      const msg = err instanceof PncpError ? err.message : String(err);
      return errorResult(t('error.search_pca', { msg }));
    }
  },
};

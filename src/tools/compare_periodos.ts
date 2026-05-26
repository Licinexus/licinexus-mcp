import { z } from 'zod';
import { aggregateLicitacoes } from './aggregate_licitacoes.js';
import { isValidPncpDate } from '../utils/dates.js';
import { EsferaSchema, ESFERA_VALUES } from '../utils/esfera.js';
import { MODALIDADE_IDS } from '../schemas/modalidades.js';
import type { ToolDef } from './types.js';
import { errorResult, jsonResult } from './types.js';
import { t } from '../utils/i18n.js';

const PeriodoSchema = z.object({
  label: z.string().min(1),
  dataInicial: z.string().refine(isValidPncpDate, 'Format must be YYYYMMDD'),
  dataFinal: z.string().refine(isValidPncpDate, 'Format must be YYYYMMDD'),
});

const ArgsSchema = z.object({
  periodoA: PeriodoSchema,
  periodoB: PeriodoSchema,
  modalidades: z.array(z.number().int()).optional(),
  uf: z.string().length(2).toUpperCase().optional(),
  codigoMunicipioIbge: z.string().optional(),
  cnpjOrgao: z
    .string()
    .regex(/^\d{14}$/, 'CNPJ must be 14 digits, no punctuation')
    .optional(),
  esfera: EsferaSchema.optional(),
  metricas: z
    .array(z.enum(['count', 'valorEstimadoTotal', 'valorHomologadoTotal']))
    .default(['count']),
});

interface AggregateResult {
  meta: Record<string, unknown>;
  series: Array<Record<string, number | string>>;
}

function sumMetrics(
  series: Array<Record<string, number | string>>,
  metricas: string[],
): Record<string, number> {
  const sums: Record<string, number> = {};
  for (const m of metricas) sums[m] = 0;
  for (const row of series) {
    for (const m of metricas) {
      const v = row[m];
      if (typeof v === 'number') sums[m] += v;
    }
  }
  return sums;
}

export const comparePeriodos: ToolDef = {
  definition: {
    name: 'compare_periodos',
    description: [
      'Compare two date ranges side-by-side over the same filters — answers questions like "did Jun/2024 (electoral year) differ from Jun/2025 in bid volumes?".',
      '',
      'Wraps two `aggregate_licitacoes_por_periodo` calls and returns each period\'s total metrics plus absolute and percentage deltas. Use granularidade-style buckets implicitly = "ano" for the comparison (one bucket per period, summed).',
      '',
      'When `esfera` filter or value metrics are requested, the underlying tool paginates internally — be conservative with range size.',
    ].join('\n'),
    inputSchema: {
      type: 'object',
      required: ['periodoA', 'periodoB'],
      properties: {
        periodoA: {
          type: 'object',
          required: ['label', 'dataInicial', 'dataFinal'],
          properties: {
            label: { type: 'string', description: 'Friendly label, e.g. "Jun/2024"' },
            dataInicial: { type: 'string', description: 'YYYYMMDD' },
            dataFinal: { type: 'string', description: 'YYYYMMDD' },
          },
        },
        periodoB: {
          type: 'object',
          required: ['label', 'dataInicial', 'dataFinal'],
          properties: {
            label: { type: 'string', description: 'Friendly label, e.g. "Jun/2025"' },
            dataInicial: { type: 'string', description: 'YYYYMMDD' },
            dataFinal: { type: 'string', description: 'YYYYMMDD' },
          },
        },
        modalidades: {
          type: 'array',
          items: { type: 'integer', enum: MODALIDADE_IDS },
          description: 'Modality codes. Default: [6, 8, 9].',
        },
        uf: { type: 'string', description: 'Two-letter state code.' },
        codigoMunicipioIbge: { type: 'string' },
        cnpjOrgao: { type: 'string', description: 'Procuring agency CNPJ.' },
        esfera: {
          type: 'string',
          enum: [...ESFERA_VALUES],
          description: 'Filter by sphere.',
        },
        metricas: {
          type: 'array',
          items: { type: 'string', enum: ['count', 'valorEstimadoTotal', 'valorHomologadoTotal'] },
          default: ['count'],
        },
      },
    },
  },

  async handler(rawArgs) {
    const parse = ArgsSchema.safeParse(rawArgs ?? {});
    if (!parse.success)
      return errorResult(t('error.invalid_arguments', { msg: parse.error.message }));
    const args = parse.data;

    const baseArgs = {
      modalidades: args.modalidades,
      uf: args.uf,
      codigoMunicipioIbge: args.codigoMunicipioIbge,
      cnpjOrgao: args.cnpjOrgao,
      esfera: args.esfera,
      metricas: args.metricas,
      granularidade: 'ano' as const,
    };

    try {
      const [respA, respB] = await Promise.all([
        aggregateLicitacoes.handler({
          ...baseArgs,
          dataInicial: args.periodoA.dataInicial,
          dataFinal: args.periodoA.dataFinal,
        }),
        aggregateLicitacoes.handler({
          ...baseArgs,
          dataInicial: args.periodoB.dataInicial,
          dataFinal: args.periodoB.dataFinal,
        }),
      ]);

      if (respA.isError) return respA;
      if (respB.isError) return respB;

      const firstTextA = respA.content.find(
        (c): c is { type: 'text'; text: string } => c.type === 'text',
      );
      const firstTextB = respB.content.find(
        (c): c is { type: 'text'; text: string } => c.type === 'text',
      );
      if (!firstTextA || !firstTextB) {
        return errorResult(t('error.aggregate_non_text'));
      }
      const dataA = JSON.parse(firstTextA.text) as AggregateResult;
      const dataB = JSON.parse(firstTextB.text) as AggregateResult;

      const totalsA = sumMetrics(dataA.series, args.metricas);
      const totalsB = sumMetrics(dataB.series, args.metricas);

      const delta: Record<string, { absoluto: number; percentual: number | null }> = {};
      for (const m of args.metricas) {
        const a = totalsA[m];
        const b = totalsB[m];
        const absoluto = b - a;
        const percentual = a === 0 ? null : (absoluto / a) * 100;
        delta[m] = { absoluto, percentual };
      }

      return jsonResult({
        meta: {
          modalidades: dataA.meta.modalidades,
          uf: args.uf,
          codigoMunicipioIbge: args.codigoMunicipioIbge,
          cnpjOrgao: args.cnpjOrgao,
          esfera: args.esfera,
          metricas: args.metricas,
        },
        periodoA: {
          label: args.periodoA.label,
          dataInicial: args.periodoA.dataInicial,
          dataFinal: args.periodoA.dataFinal,
          totals: totalsA,
        },
        periodoB: {
          label: args.periodoB.label,
          dataInicial: args.periodoB.dataInicial,
          dataFinal: args.periodoB.dataFinal,
          totals: totalsB,
        },
        delta,
      });
    } catch (err) {
      return errorResult(
        t('error.compare_periodos', { msg: err instanceof Error ? err.message : String(err) }),
      );
    }
  },
};

import { z } from 'zod';
import { listContratacoes, PncpError } from '../adapters/pncp.js';
import { isValidPncpDate, daysBetweenPncpDates, PNCP_MAX_DATE_RANGE_DAYS } from '../utils/dates.js';
import { DEFAULT_MODALIDADES, MODALIDADE_IDS, MODALIDADES_PNCP } from '../schemas/modalidades.js';
import { EsferaSchema, ESFERA_VALUES, matchesEsfera } from '../utils/esfera.js';
import type { ToolDef } from './types.js';
import { errorResult, jsonResult } from './types.js';

const MAX_AGGREGATION_DAYS = 1830; // ~5 years
const MAX_PAGES_PER_BUCKET = 50; // hard cap when paginating for valor/esfera (50 pages × 50 items = 2500)

const MetricaSchema = z.enum(['count', 'valorEstimadoTotal', 'valorHomologadoTotal']);
const GranularidadeSchema = z.enum(['dia', 'semana', 'mes', 'ano']);

const ArgsSchema = z.object({
  dataInicial: z.string().refine(isValidPncpDate, 'Format must be YYYYMMDD'),
  dataFinal: z.string().refine(isValidPncpDate, 'Format must be YYYYMMDD'),
  granularidade: GranularidadeSchema.default('mes'),
  modalidades: z.array(z.number().int()).optional(),
  uf: z.string().length(2).toUpperCase().optional(),
  codigoMunicipioIbge: z.string().optional(),
  cnpjOrgao: z
    .string()
    .regex(/^\d{14}$/, 'CNPJ must be 14 digits, no punctuation')
    .optional(),
  esfera: EsferaSchema.optional(),
  metricas: z.array(MetricaSchema).default(['count']),
});

type Args = z.infer<typeof ArgsSchema>;
type Granularidade = z.infer<typeof GranularidadeSchema>;

function parsePncpDate(s: string): Date {
  return new Date(
    Date.UTC(Number(s.slice(0, 4)), Number(s.slice(4, 6)) - 1, Number(s.slice(6, 8))),
  );
}

function formatPncp(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function bucketKey(d: Date, gran: Granularidade): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  if (gran === 'ano') return `${y}`;
  if (gran === 'mes') return `${y}-${m}`;
  if (gran === 'dia') return `${y}-${m}-${day}`;
  // semana = ISO week
  const target = new Date(Date.UTC(y, d.getUTCMonth(), d.getUTCDate()));
  target.setUTCDate(target.getUTCDate() + 3 - ((target.getUTCDay() + 6) % 7));
  const week1 = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((target.getTime() - week1.getTime()) / 86_400_000 - 3 + ((week1.getUTCDay() + 6) % 7)) / 7,
    );
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

interface Bucket {
  dataInicial: string;
  dataFinal: string;
  key: string;
}

function generateBuckets(dataInicial: string, dataFinal: string, gran: Granularidade): Bucket[] {
  const start = parsePncpDate(dataInicial);
  const end = parsePncpDate(dataFinal);
  const buckets: Bucket[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    const bucketStart = new Date(cursor);
    const bucketEnd = new Date(cursor);

    if (gran === 'dia') {
      // bucketEnd = bucketStart
    } else if (gran === 'semana') {
      bucketEnd.setUTCDate(bucketEnd.getUTCDate() + 6);
    } else if (gran === 'mes') {
      bucketEnd.setUTCMonth(bucketEnd.getUTCMonth() + 1);
      bucketEnd.setUTCDate(0); // last day of original month
    } else if (gran === 'ano') {
      bucketEnd.setUTCFullYear(bucketEnd.getUTCFullYear() + 1);
      bucketEnd.setUTCDate(bucketEnd.getUTCDate() - 1);
    }

    if (bucketEnd > end) bucketEnd.setTime(end.getTime());

    buckets.push({
      dataInicial: formatPncp(bucketStart),
      dataFinal: formatPncp(bucketEnd),
      key: bucketKey(bucketStart, gran),
    });

    // advance cursor
    if (gran === 'dia') cursor.setUTCDate(cursor.getUTCDate() + 1);
    else if (gran === 'semana') cursor.setUTCDate(cursor.getUTCDate() + 7);
    else if (gran === 'mes') {
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      cursor.setUTCDate(1);
    } else if (gran === 'ano') {
      cursor.setUTCFullYear(cursor.getUTCFullYear() + 1);
      cursor.setUTCMonth(0);
      cursor.setUTCDate(1);
    }
  }
  return buckets;
}

interface BucketResult {
  count: number;
  valorEstimadoTotal: number;
  valorHomologadoTotal: number;
  paginated: boolean;
}

async function processBucket(
  bucket: Bucket,
  modalidade: number,
  args: Args,
  needsPagination: boolean,
): Promise<BucketResult> {
  // Fast path: count-only without esfera filter → just read totalRegistros from page 1
  if (!needsPagination) {
    const page = await listContratacoes({
      dataInicial: bucket.dataInicial,
      dataFinal: bucket.dataFinal,
      codigoModalidadeContratacao: modalidade,
      uf: args.uf,
      codigoMunicipioIbge: args.codigoMunicipioIbge,
      cnpj: args.cnpjOrgao,
      pagina: 1,
      tamanhoPagina: 10,
    });
    return {
      count: page.totalRegistros ?? 0,
      valorEstimadoTotal: 0,
      valorHomologadoTotal: 0,
      paginated: false,
    };
  }

  // Slow path: paginate and aggregate client-side (needed for esfera filter or valor sum)
  let count = 0;
  let valorEstimadoTotal = 0;
  let valorHomologadoTotal = 0;
  let pagina = 1;
  while (pagina <= MAX_PAGES_PER_BUCKET) {
    const page = await listContratacoes({
      dataInicial: bucket.dataInicial,
      dataFinal: bucket.dataFinal,
      codigoModalidadeContratacao: modalidade,
      uf: args.uf,
      codigoMunicipioIbge: args.codigoMunicipioIbge,
      cnpj: args.cnpjOrgao,
      pagina,
      tamanhoPagina: 50,
    });
    if (page.data.length === 0) break;
    for (const c of page.data) {
      if (!matchesEsfera(c, args.esfera)) continue;
      count++;
      if (c.valorTotalEstimado != null) valorEstimadoTotal += c.valorTotalEstimado;
      if (c.valorTotalHomologado != null) valorHomologadoTotal += c.valorTotalHomologado;
    }
    const totalPaginas = page.totalPaginas ?? 1;
    if (pagina >= totalPaginas) break;
    pagina++;
  }
  return { count, valorEstimadoTotal, valorHomologadoTotal, paginated: true };
}

export const aggregateLicitacoes: ToolDef = {
  definition: {
    name: 'aggregate_licitacoes_por_periodo',
    description: [
      'Aggregate Brazilian public procurement bid counts (and optional value sums) over a time series — answers "how did volumes evolve month by month" without paginating tens of thousands of records.',
      '',
      'Each bucket is computed by issuing a single PNCP `list` call per (bucket × modality) and reading `totalRegistros` from the response. With default modalities (Pregão Eletrônico + Dispensa + Inexigibilidade) and granularidade=mes, a 12-month range = 36 calls.',
      '',
      'When `esfera` filter or value metrics are requested, the tool paginates the bucket internally (up to 50 pages = 2500 records per bucket) and aggregates client-side. Be conservative with date range × granularity in that mode.',
      '',
      `Maximum total date range: ${MAX_AGGREGATION_DAYS} days (~5 years). Each bucket call respects the PNCP ${PNCP_MAX_DATE_RANGE_DAYS}-day-per-call limit.`,
      '',
      'Modality codes:',
      ...MODALIDADES_PNCP.map((m) => `  ${m.id} = ${m.nome}`),
      '',
      'Default modalities: [6, 8, 9] (Pregão Eletrônico, Dispensa, Inexigibilidade).',
    ].join('\n'),
    inputSchema: {
      type: 'object',
      required: ['dataInicial', 'dataFinal'],
      properties: {
        dataInicial: { type: 'string', description: 'Start date YYYYMMDD.' },
        dataFinal: { type: 'string', description: 'End date YYYYMMDD.' },
        granularidade: {
          type: 'string',
          enum: ['dia', 'semana', 'mes', 'ano'],
          default: 'mes',
          description: 'Time bucket size for the series.',
        },
        modalidades: {
          type: 'array',
          items: { type: 'integer', enum: MODALIDADE_IDS },
          description: 'List of modality codes. Default: [6, 8, 9].',
        },
        uf: { type: 'string', description: 'Two-letter state code.' },
        codigoMunicipioIbge: { type: 'string', description: 'IBGE municipality code.' },
        cnpjOrgao: { type: 'string', description: 'Procuring agency CNPJ.' },
        esfera: {
          type: 'string',
          enum: [...ESFERA_VALUES],
          description:
            "Filter by sphere ('federal', 'estadual', 'municipal', 'distrital'). Forces paginated aggregation — be conservative with range × granularity.",
        },
        metricas: {
          type: 'array',
          items: { type: 'string', enum: ['count', 'valorEstimadoTotal', 'valorHomologadoTotal'] },
          default: ['count'],
          description:
            "Metrics to include in each bucket. 'count' is free (single page hit). 'valorEstimadoTotal' and 'valorHomologadoTotal' force paginated aggregation.",
        },
      },
    },
  },

  async handler(rawArgs) {
    const parse = ArgsSchema.safeParse(rawArgs ?? {});
    if (!parse.success) return errorResult(`Invalid arguments: ${parse.error.message}`);
    const args = parse.data;

    const days = daysBetweenPncpDates(args.dataInicial, args.dataFinal);
    if (days == null) return errorResult('Invalid dataInicial/dataFinal format. Use YYYYMMDD.');
    if (days < 0) return errorResult('dataInicial must be on or before dataFinal.');
    if (days > MAX_AGGREGATION_DAYS) {
      return errorResult(
        `Date range of ${days} days exceeds the aggregation limit of ${MAX_AGGREGATION_DAYS} days (~5 years).`,
      );
    }

    const modalidades = args.modalidades ?? DEFAULT_MODALIDADES;
    const buckets = generateBuckets(args.dataInicial, args.dataFinal, args.granularidade);

    if (buckets.length === 0) return errorResult('No buckets generated for the given range.');

    const wantsValor =
      args.metricas.includes('valorEstimadoTotal') ||
      args.metricas.includes('valorHomologadoTotal');
    const needsPagination = wantsValor || args.esfera != null;

    // Safety budget for paginated mode
    const totalCalls = buckets.length * modalidades.length;
    if (needsPagination && totalCalls > 200) {
      return errorResult(
        `Combination would require ${totalCalls} paginated buckets — too expensive. Reduce range, increase granularity, or limit modalities.`,
      );
    }

    try {
      // Run sequentially within a bucket × modalidade pair to be polite with PNCP,
      // but parallel across pairs with a small concurrency cap.
      const tasks = buckets.flatMap((b) => modalidades.map((m) => ({ bucket: b, modalidade: m })));
      const concurrency = 4;
      const results = new Array<{
        bucket: Bucket;
        modalidade: number;
        result: BucketResult;
      }>(tasks.length);

      let cursor = 0;
      async function worker() {
        while (true) {
          const i = cursor++;
          if (i >= tasks.length) return;
          const task = tasks[i];
          results[i] = {
            bucket: task.bucket,
            modalidade: task.modalidade,
            result: await processBucket(task.bucket, task.modalidade, args, needsPagination),
          };
        }
      }
      await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));

      // Reduce: group by bucket key
      const grouped = new Map<
        string,
        {
          count: number;
          valorEstimadoTotal: number;
          valorHomologadoTotal: number;
          paginated: boolean;
        }
      >();
      for (const { bucket, result } of results) {
        const existing = grouped.get(bucket.key) ?? {
          count: 0,
          valorEstimadoTotal: 0,
          valorHomologadoTotal: 0,
          paginated: false,
        };
        existing.count += result.count;
        existing.valorEstimadoTotal += result.valorEstimadoTotal;
        existing.valorHomologadoTotal += result.valorHomologadoTotal;
        existing.paginated = existing.paginated || result.paginated;
        grouped.set(bucket.key, existing);
      }

      // Output in bucket order
      const seenKeys = new Set<string>();
      const series = buckets
        .filter((b) => {
          if (seenKeys.has(b.key)) return false;
          seenKeys.add(b.key);
          return true;
        })
        .map((b) => {
          const g = grouped.get(b.key);
          const row: Record<string, unknown> = {
            periodo: b.key,
            dataInicial: b.dataInicial,
            dataFinal: b.dataFinal,
          };
          if (args.metricas.includes('count')) row.count = g?.count ?? 0;
          if (args.metricas.includes('valorEstimadoTotal'))
            row.valorEstimadoTotal = g?.valorEstimadoTotal ?? 0;
          if (args.metricas.includes('valorHomologadoTotal'))
            row.valorHomologadoTotal = g?.valorHomologadoTotal ?? 0;
          return row;
        });

      return jsonResult({
        meta: {
          dataInicial: args.dataInicial,
          dataFinal: args.dataFinal,
          granularidade: args.granularidade,
          modalidades,
          uf: args.uf,
          codigoMunicipioIbge: args.codigoMunicipioIbge,
          cnpjOrgao: args.cnpjOrgao,
          esfera: args.esfera,
          metricas: args.metricas,
          buckets: series.length,
          pncpCalls: results.length,
          paginated: needsPagination,
        },
        series,
      });
    } catch (err) {
      const msg = err instanceof PncpError ? err.message : String(err);
      return errorResult(`Failed to aggregate: ${msg}`);
    }
  },
};

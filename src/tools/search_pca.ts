import { z } from 'zod';
import { listPca, PncpError } from '../adapters/pncp.js';
import type { ToolDef } from './types.js';
import { errorResult, jsonResult } from './types.js';

const ArgsSchema = z.object({
  anoPca: z
    .number()
    .int()
    .min(2020)
    .max(2100)
    .optional()
    .describe('Year of the PCA (Plano de Contratação Anual). Defaults to current year.'),
  cnpjOrgao: z
    .string()
    .regex(/^\d{14}$/, 'CNPJ must be 14 digits')
    .optional(),
  pagina: z.number().int().min(1).default(1),
  tamanhoPagina: z.number().int().min(1).max(50).default(20),
});

export const searchPca: ToolDef = {
  definition: {
    name: 'search_pca',
    description:
      'Search Plano de Contratação Anual (PCA) — what public agencies INTEND to buy this year, per Lei 14.133. Forward-looking signal: tells you upcoming opportunities before they hit the bid stage. One of the most under-used data sources for govtech sales.',
    inputSchema: {
      type: 'object',
      properties: {
        anoPca: {
          type: 'integer',
          description: 'Year of the PCA (e.g. 2025). Defaults to current year.',
        },
        cnpjOrgao: { type: 'string', description: 'Filter by procuring agency CNPJ' },
        pagina: { type: 'integer', minimum: 1, default: 1 },
        tamanhoPagina: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
      },
    },
  },

  async handler(rawArgs) {
    const parse = ArgsSchema.safeParse(rawArgs ?? {});
    if (!parse.success) return errorResult(`Invalid arguments: ${parse.error.message}`);
    const args = parse.data;
    const ano = args.anoPca ?? new Date().getFullYear();
    try {
      const page = await listPca({
        anoPca: ano,
        cnpjOrgao: args.cnpjOrgao,
        pagina: args.pagina,
        tamanhoPagina: args.tamanhoPagina,
      });
      return jsonResult({
        meta: { anoPca: ano, total: page.data.length, totalPncp: page.totalRegistros },
        planos: page.data,
      });
    } catch (err) {
      const msg = err instanceof PncpError ? err.message : String(err);
      return errorResult(`Failed to search PCA: ${msg}`);
    }
  },
};

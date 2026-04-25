import { z } from 'zod';
import { listItemResultados, PncpError } from '../adapters/pncp.js';
import { PncpIdInputSchema, resolvePncpId } from '../utils/pncp_id.js';
import type { ToolDef } from './types.js';
import { errorResult, jsonResult } from './types.js';

const ArgsSchema = PncpIdInputSchema.and(
  z.object({
    numeroItem: z
      .number()
      .int()
      .positive()
      .describe('Item number within the licitação (use list_licitacao_itens first to discover).'),
  }),
);

export const listLicitacaoResultados: ToolDef = {
  definition: {
    name: 'list_licitacao_resultados',
    description:
      'List the bidding results (winners, runners-up, prices, suppliers) for a specific item of a licitação. You must specify which item — use list_licitacao_itens first to discover item numbers.',
    inputSchema: {
      type: 'object',
      properties: {
        numeroControlePNCP: { type: 'string' },
        orgaoCnpj: { type: 'string' },
        ano: { type: 'integer' },
        sequencial: { type: 'integer' },
        numeroItem: {
          type: 'integer',
          minimum: 1,
          description: 'The item number (numeroItem) to retrieve results for.',
        },
      },
      required: ['numeroItem'],
    },
  },

  async handler(rawArgs) {
    const parse = ArgsSchema.safeParse(rawArgs ?? {});
    if (!parse.success) {
      return errorResult(`Invalid arguments: ${parse.error.message}`);
    }
    try {
      const { orgaoCnpj, ano, sequencial } = resolvePncpId(parse.data);
      const { numeroItem } = parse.data;
      const results = await listItemResultados(orgaoCnpj, ano, sequencial, numeroItem);
      return jsonResult({
        meta: { orgaoCnpj, ano, sequencial, numeroItem, total: results.length },
        resultados: results,
      });
    } catch (err) {
      const msg = err instanceof PncpError ? err.message : String(err);
      return errorResult(`Failed to list resultados: ${msg}`);
    }
  },
};

import { listContratoTermos, PncpError } from '../adapters/pncp.js';
import { PncpIdInputSchema, resolvePncpId } from '../utils/pncp_id.js';
import type { ToolDef } from './types.js';
import { errorResult, jsonResult } from './types.js';

export const listContratoTermosTool: ToolDef = {
  definition: {
    name: 'list_contrato_termos',
    description:
      'List the additive terms (termos aditivos) of a contract — extensions, value increases/reductions, term changes. Useful to understand contract evolution.',
    inputSchema: {
      type: 'object',
      properties: {
        numeroControlePNCP: { type: 'string' },
        orgaoCnpj: { type: 'string' },
        ano: { type: 'integer' },
        sequencial: { type: 'integer' },
      },
    },
  },

  async handler(rawArgs) {
    const parse = PncpIdInputSchema.safeParse(rawArgs ?? {});
    if (!parse.success) return errorResult(`Invalid arguments: ${parse.error.message}`);
    try {
      const { orgaoCnpj, ano, sequencial } = resolvePncpId(parse.data);
      const termos = await listContratoTermos(orgaoCnpj, ano, sequencial);
      return jsonResult({
        meta: { orgaoCnpj, ano, sequencial, total: termos.length },
        termos,
      });
    } catch (err) {
      const msg = err instanceof PncpError ? err.message : String(err);
      return errorResult(`Failed to list termos: ${msg}`);
    }
  },
};

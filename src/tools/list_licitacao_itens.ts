import { listContratacaoItens, PncpError } from '../adapters/pncp.js';
import { PncpIdInputSchema, resolvePncpId } from '../utils/pncp_id.js';
import type { ToolDef } from './types.js';
import { errorResult, jsonResult } from './types.js';

export const listLicitacaoItens: ToolDef = {
  definition: {
    name: 'list_licitacao_itens',
    description:
      'List the items (lots) of a licitação on PNCP. Each item has description, quantity, unit, estimated unit value and category. Provide either numeroControlePNCP, or orgaoCnpj/ano/sequencial.',
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
    if (!parse.success) {
      return errorResult(`Invalid arguments: ${parse.error.message}`);
    }
    try {
      const { orgaoCnpj, ano, sequencial } = resolvePncpId(parse.data);
      const items = await listContratacaoItens(orgaoCnpj, ano, sequencial);
      return jsonResult({
        meta: { orgaoCnpj, ano, sequencial, total: items.length },
        items,
      });
    } catch (err) {
      const msg = err instanceof PncpError ? err.message : String(err);
      return errorResult(`Failed to list itens: ${msg}`);
    }
  },
};

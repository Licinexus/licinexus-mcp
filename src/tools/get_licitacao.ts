import { getContratacao, PncpError } from '../adapters/pncp.js';
import { PncpIdInputSchema, resolvePncpId } from '../utils/pncp_id.js';
import type { ToolDef } from './types.js';
import { errorResult, jsonResult } from './types.js';

const ArgsSchema = PncpIdInputSchema;

export const getLicitacao: ToolDef = {
  definition: {
    name: 'get_licitacao',
    description:
      'Get the full details of a single licitação (procurement bid) on PNCP. Provide either numeroControlePNCP (the full PNCP control number string) or all three of orgaoCnpj, ano, sequencial.',
    inputSchema: {
      type: 'object',
      properties: {
        numeroControlePNCP: {
          type: 'string',
          description: 'PNCP control number, format like 00000000000000-1-000001/2024',
        },
        orgaoCnpj: { type: 'string', description: 'Procuring agency CNPJ (14 digits)' },
        ano: { type: 'integer', description: 'Year of the bid (e.g. 2024)' },
        sequencial: { type: 'integer', description: 'Sequential number of the bid' },
      },
    },
  },

  async handler(rawArgs) {
    const parse = ArgsSchema.safeParse(rawArgs ?? {});
    if (!parse.success) {
      return errorResult(`Invalid arguments: ${parse.error.message}`);
    }
    try {
      const { orgaoCnpj, ano, sequencial } = resolvePncpId(parse.data);
      const data = await getContratacao(orgaoCnpj, ano, sequencial);
      return jsonResult(data);
    } catch (err) {
      const msg = err instanceof PncpError ? err.message : String(err);
      return errorResult(`Failed to get licitação: ${msg}`);
    }
  },
};

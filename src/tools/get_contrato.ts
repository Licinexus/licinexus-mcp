import { getContrato, PncpError } from '../adapters/pncp.js';
import { PncpIdInputSchema, resolvePncpId } from '../utils/pncp_id.js';
import type { ToolDef } from './types.js';
import { errorResult, jsonResult } from './types.js';
import { t } from '../utils/i18n.js';

export const getContratoTool: ToolDef = {
  definition: {
    name: 'get_contrato',
    description:
      'Get the full details of a public contract on PNCP. Provide either numeroControlePNCP or orgaoCnpj/ano/sequencial.',
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
    if (!parse.success)
      return errorResult(t('error.invalid_arguments', { msg: parse.error.message }));
    try {
      const { orgaoCnpj, ano, sequencial } = resolvePncpId(parse.data);
      const data = await getContrato(orgaoCnpj, ano, sequencial);
      return jsonResult(data);
    } catch (err) {
      const msg = err instanceof PncpError ? err.message : String(err);
      return errorResult(t('error.get_contrato', { msg }));
    }
  },
};

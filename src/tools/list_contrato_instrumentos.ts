import { listContratoInstrumentos, PncpError } from '../adapters/pncp.js';
import { PncpIdInputSchema, resolvePncpId } from '../utils/pncp_id.js';
import type { ToolDef } from './types.js';
import { errorResult, jsonResult } from './types.js';
import { t } from '../utils/i18n.js';

export const listContratoInstrumentosTool: ToolDef = {
  definition: {
    name: 'list_contrato_instrumentos',
    description:
      'List billing instruments (NFes, faturas) attached to a contract. Reveals real execution: when payments were due, NFe keys, etc.',
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
      const instrumentos = await listContratoInstrumentos(orgaoCnpj, ano, sequencial);
      return jsonResult({
        meta: { orgaoCnpj, ano, sequencial, total: instrumentos.length },
        instrumentos,
      });
    } catch (err) {
      const msg = err instanceof PncpError ? err.message : String(err);
      return errorResult(t('error.list_instrumentos', { msg }));
    }
  },
};

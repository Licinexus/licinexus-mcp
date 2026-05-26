import { z } from 'zod';
import { getOrgao, PncpError } from '../adapters/pncp.js';
import { normalizeCnpj } from '../utils/pncp_id.js';
import type { ToolDef } from './types.js';
import { errorResult, jsonResult } from './types.js';
import { t } from '../utils/i18n.js';

const ArgsSchema = z.object({
  cnpj: z.string(),
});

export const getOrgaoTool: ToolDef = {
  definition: {
    name: 'get_orgao',
    description:
      "Get a public agency's profile from PNCP: legal name, branch of government (poder), federal/state/municipal level (esfera), legal nature, address.",
    inputSchema: {
      type: 'object',
      properties: {
        cnpj: { type: 'string', description: 'Agency CNPJ (14 digits)' },
      },
      required: ['cnpj'],
    },
  },

  async handler(rawArgs) {
    const parse = ArgsSchema.safeParse(rawArgs ?? {});
    if (!parse.success)
      return errorResult(t('error.invalid_arguments', { msg: parse.error.message }));
    try {
      const cnpj = normalizeCnpj(parse.data.cnpj);
      const data = await getOrgao(cnpj);
      return jsonResult(data);
    } catch (err) {
      const msg = err instanceof PncpError ? err.message : String(err);
      return errorResult(t('error.get_orgao', { msg }));
    }
  },
};

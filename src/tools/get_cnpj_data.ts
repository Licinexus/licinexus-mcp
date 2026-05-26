import { z } from 'zod';
import { CnpjError, getCnpjData } from '../adapters/cnpj.js';
import type { ToolDef } from './types.js';
import { errorResult, jsonResult } from './types.js';
import { t } from '../utils/i18n.js';

const ArgsSchema = z.object({
  cnpj: z.string(),
});

export const getCnpjDataTool: ToolDef = {
  definition: {
    name: 'get_cnpj_data',
    description:
      "Get a Brazilian company's public registration data: legal name, trade name, primary CNAE, secondary CNAEs, address, partners (QSA), capital, juridical nature, Simples/MEI status. Source: BrasilAPI by default (free aggregator over Receita Federal Open Data). Set CNPJ_PROVIDER=minhareceita to switch.",
    inputSchema: {
      type: 'object',
      properties: {
        cnpj: {
          type: 'string',
          description: 'CNPJ in any format — punctuation is stripped. 14 digits expected.',
        },
      },
      required: ['cnpj'],
    },
  },

  async handler(rawArgs) {
    const parse = ArgsSchema.safeParse(rawArgs ?? {});
    if (!parse.success)
      return errorResult(t('error.invalid_arguments', { msg: parse.error.message }));
    try {
      const data = await getCnpjData(parse.data.cnpj);
      return jsonResult(data);
    } catch (err) {
      const msg = err instanceof CnpjError ? err.message : String(err);
      return errorResult(t('error.get_cnpj_data', { msg }));
    }
  },
};

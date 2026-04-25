import { z } from 'zod';
import { listPcaItens, PncpError } from '../adapters/pncp.js';
import { normalizeCnpj } from '../utils/pncp_id.js';
import type { ToolDef } from './types.js';
import { errorResult, jsonResult } from './types.js';

const ArgsSchema = z.object({
  orgaoCnpj: z.string(),
  anoPca: z.number().int(),
  sequencialPca: z.number().int(),
  palavraChave: z.string().min(2).optional(),
});

export const listPcaItensTool: ToolDef = {
  definition: {
    name: 'list_pca_itens',
    description:
      'List the planned items of a specific PCA: descriptions, estimated quantities, unit values, expected delivery dates, and CATSER/CATMAT classification. Optionally filter client-side by keyword on description.',
    inputSchema: {
      type: 'object',
      properties: {
        orgaoCnpj: { type: 'string' },
        anoPca: { type: 'integer' },
        sequencialPca: { type: 'integer' },
        palavraChave: { type: 'string', description: 'Filter on descricaoItem' },
      },
      required: ['orgaoCnpj', 'anoPca', 'sequencialPca'],
    },
  },

  async handler(rawArgs) {
    const parse = ArgsSchema.safeParse(rawArgs ?? {});
    if (!parse.success) return errorResult(`Invalid arguments: ${parse.error.message}`);
    const args = parse.data;
    try {
      const cnpj = normalizeCnpj(args.orgaoCnpj);
      const itens = await listPcaItens(cnpj, args.anoPca, args.sequencialPca);
      const filtered = args.palavraChave
        ? itens.filter((i) =>
            (i.descricaoItem ?? '').toLowerCase().includes(args.palavraChave!.toLowerCase()),
          )
        : itens;
      return jsonResult({
        meta: {
          orgaoCnpj: cnpj,
          anoPca: args.anoPca,
          sequencialPca: args.sequencialPca,
          total: filtered.length,
          totalAntesFiltro: itens.length,
        },
        itens: filtered,
      });
    } catch (err) {
      const msg = err instanceof PncpError ? err.message : String(err);
      return errorResult(`Failed to list PCA itens: ${msg}`);
    }
  },
};

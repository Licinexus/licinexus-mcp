import { z } from 'zod';
import { getAta, listAtaItens, listAtaArquivos, PncpError } from '../adapters/pncp.js';
import { normalizeCnpj } from '../utils/pncp_id.js';
import type { ToolDef } from './types.js';
import { errorResult, jsonResult } from './types.js';

const ArgsSchema = z.object({
  orgaoCnpj: z.string(),
  anoCompra: z.number().int(),
  sequencialCompra: z.number().int(),
  sequencialAta: z.number().int(),
  includeItens: z.boolean().default(true),
  includeArquivos: z.boolean().default(false),
});

export const getAtaRp: ToolDef = {
  definition: {
    name: 'get_ata_rp',
    description:
      'Get the full details of an Ata de Registro de Preço, optionally including its items (with available balance and supplier info) and attached files. Use orgaoCnpj/anoCompra/sequencialCompra (the parent procurement) and sequencialAta (the ARP within that procurement).',
    inputSchema: {
      type: 'object',
      properties: {
        orgaoCnpj: { type: 'string', description: 'Procuring agency CNPJ' },
        anoCompra: { type: 'integer', description: 'Year of the parent procurement' },
        sequencialCompra: {
          type: 'integer',
          description: 'Sequential of the parent procurement',
        },
        sequencialAta: { type: 'integer', description: 'Sequential of the ARP' },
        includeItens: { type: 'boolean', default: true },
        includeArquivos: { type: 'boolean', default: false },
      },
      required: ['orgaoCnpj', 'anoCompra', 'sequencialCompra', 'sequencialAta'],
    },
  },

  async handler(rawArgs) {
    const parse = ArgsSchema.safeParse(rawArgs ?? {});
    if (!parse.success) return errorResult(`Invalid arguments: ${parse.error.message}`);
    const args = parse.data;
    try {
      const cnpj = normalizeCnpj(args.orgaoCnpj);
      const [ata, itens, arquivos] = await Promise.all([
        getAta(cnpj, args.anoCompra, args.sequencialCompra, args.sequencialAta),
        args.includeItens
          ? listAtaItens(cnpj, args.anoCompra, args.sequencialCompra, args.sequencialAta)
          : Promise.resolve(undefined),
        args.includeArquivos
          ? listAtaArquivos(cnpj, args.anoCompra, args.sequencialCompra, args.sequencialAta)
          : Promise.resolve(undefined),
      ]);
      return jsonResult({
        ata,
        itens,
        arquivos,
      });
    } catch (err) {
      const msg = err instanceof PncpError ? err.message : String(err);
      return errorResult(`Failed to get ata RP: ${msg}`);
    }
  },
};

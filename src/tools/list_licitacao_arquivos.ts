import { listContratacaoArquivos, PncpError } from '../adapters/pncp.js';
import { PncpIdInputSchema, resolvePncpId } from '../utils/pncp_id.js';
import type { ToolDef } from './types.js';
import { errorResult, jsonResult } from './types.js';

export const listLicitacaoArquivos: ToolDef = {
  definition: {
    name: 'list_licitacao_arquivos',
    description:
      'List the files (edital PDFs, attachments, terms of reference) attached to a licitação on PNCP. Returns metadata and direct URLs — does not download the file content.',
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
      const files = await listContratacaoArquivos(orgaoCnpj, ano, sequencial);
      return jsonResult({
        meta: { orgaoCnpj, ano, sequencial, total: files.length },
        arquivos: files,
      });
    } catch (err) {
      const msg = err instanceof PncpError ? err.message : String(err);
      return errorResult(`Failed to list arquivos: ${msg}`);
    }
  },
};

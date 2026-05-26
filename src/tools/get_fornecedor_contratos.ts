import { z } from 'zod';
import { listContratos, PncpError } from '../adapters/pncp.js';
import { defaultDateRange } from '../utils/dates.js';
import { normalizeCnpj } from '../utils/pncp_id.js';
import type { ToolDef } from './types.js';
import { errorResult, jsonResult } from './types.js';
import { t } from '../utils/i18n.js';

const ArgsSchema = z.object({
  cnpj: z.string(),
  diasAtras: z.number().int().min(1).max(3650).default(365),
  pagina: z.number().int().min(1).default(1),
  tamanhoPagina: z.number().int().min(10).max(50).default(50),
});

export const getFornecedorContratos: ToolDef = {
  definition: {
    name: 'get_fornecedor_contratos',
    description:
      'List public contracts where a given CNPJ appears as the supplier (fornecedor). Useful for analyzing a competitor or a potential partner. Defaults to the last 365 days.',
    inputSchema: {
      type: 'object',
      properties: {
        cnpj: { type: 'string', description: 'Supplier CNPJ (14 digits)' },
        diasAtras: {
          type: 'integer',
          minimum: 1,
          maximum: 3650,
          default: 365,
          description: 'How many days back to search.',
        },
        pagina: { type: 'integer', minimum: 1, default: 1 },
        tamanhoPagina: { type: 'integer', minimum: 10, maximum: 50, default: 50 },
      },
      required: ['cnpj'],
    },
  },

  async handler(rawArgs) {
    const parse = ArgsSchema.safeParse(rawArgs ?? {});
    if (!parse.success)
      return errorResult(t('error.invalid_arguments', { msg: parse.error.message }));
    const args = parse.data;
    try {
      const cnpj = normalizeCnpj(args.cnpj);
      const { dataInicial, dataFinal } = defaultDateRange(args.diasAtras);
      const page = await listContratos({
        dataInicial,
        dataFinal,
        cnpjFornecedor: cnpj,
        pagina: args.pagina,
        tamanhoPagina: args.tamanhoPagina,
      });
      return jsonResult({
        meta: {
          cnpjFornecedor: cnpj,
          dataInicial,
          dataFinal,
          totalRetornados: page.data.length,
          totalPncp: page.totalRegistros,
        },
        contratos: page.data.map((c) => ({
          numeroControlePNCP: c.numeroControlePNCP,
          objeto: c.objetoContrato,
          valorInicial: c.valorInicial,
          valorGlobal: c.valorGlobal,
          orgao: c.orgaoEntidade?.razaoSocial,
          cnpjOrgao: c.orgaoEntidade?.cnpj,
          uf: c.unidadeOrgao?.ufSigla,
          dataAssinatura: c.dataAssinatura,
          vigenciaInicio: c.dataVigenciaInicio,
          vigenciaFim: c.dataVigenciaFim,
        })),
      });
    } catch (err) {
      const msg = err instanceof PncpError ? err.message : String(err);
      return errorResult(t('error.get_fornecedor_contratos', { msg }));
    }
  },
};

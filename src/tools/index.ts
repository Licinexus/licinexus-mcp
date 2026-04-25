import type { ToolDef } from './types.js';
import { searchLicitacoes } from './search_licitacoes.js';
import { getLicitacao } from './get_licitacao.js';
import { listLicitacaoItens } from './list_licitacao_itens.js';
import { listLicitacaoResultados } from './list_licitacao_resultados.js';
import { listLicitacaoArquivos } from './list_licitacao_arquivos.js';
import { searchContratos } from './search_contratos.js';
import { getContratoTool } from './get_contrato.js';
import { listContratoTermosTool } from './list_contrato_termos.js';
import { listContratoInstrumentosTool } from './list_contrato_instrumentos.js';
import { searchAtasRp } from './search_atas_rp.js';
import { getAtaRp } from './get_ata_rp.js';
import { getOrgaoTool } from './get_orgao.js';
import { getFornecedorContratos } from './get_fornecedor_contratos.js';
import { searchPca } from './search_pca.js';
import { listPcaItensTool } from './list_pca_itens.js';
import { getCnpjDataTool } from './get_cnpj_data.js';

export const allTools: ToolDef[] = [
  // Compras / Licitações
  searchLicitacoes,
  getLicitacao,
  listLicitacaoItens,
  listLicitacaoResultados,
  listLicitacaoArquivos,
  // Contratos
  searchContratos,
  getContratoTool,
  listContratoTermosTool,
  listContratoInstrumentosTool,
  // Atas RP
  searchAtasRp,
  getAtaRp,
  // Órgãos / Fornecedores
  getOrgaoTool,
  getFornecedorContratos,
  // PCA
  searchPca,
  listPcaItensTool,
  // CNPJ enrichment
  getCnpjDataTool,
];

export const toolMap = new Map<string, ToolDef>(allTools.map((t) => [t.definition.name, t]));

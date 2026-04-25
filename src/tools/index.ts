import type { ToolDef } from './types.js';
import { searchLicitacoes } from './search_licitacoes.js';
import { getLicitacao } from './get_licitacao.js';
import { listLicitacaoItens } from './list_licitacao_itens.js';
import { listLicitacaoResultados } from './list_licitacao_resultados.js';
import { listLicitacaoArquivos } from './list_licitacao_arquivos.js';

export const allTools: ToolDef[] = [
  searchLicitacoes,
  getLicitacao,
  listLicitacaoItens,
  listLicitacaoResultados,
  listLicitacaoArquivos,
];

export const toolMap = new Map<string, ToolDef>(allTools.map((t) => [t.definition.name, t]));

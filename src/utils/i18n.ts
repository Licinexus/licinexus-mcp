type Lang = 'pt' | 'en';

const messages: Record<string, { pt: string; en: string }> = {
  // ── Validation ─────────────────────────────────────────────────────
  'error.invalid_arguments': {
    pt: 'Argumentos inválidos: {msg}',
    en: 'Invalid arguments: {msg}',
  },
  'error.date_format': {
    pt: 'Formato de data inválido. Use YYYYMMDD.',
    en: 'Invalid date format. Use YYYYMMDD.',
  },
  'error.date_order': {
    pt: 'dataInicial ({inicial}) deve ser anterior ou igual a dataFinal ({final}).',
    en: 'dataInicial ({inicial}) must be on or before dataFinal ({final}).',
  },
  'error.date_range_too_wide': {
    pt: 'Intervalo de {days} dias excede o limite PNCP de {max} dias. Reduza a janela entre dataInicial ({inicial}) e dataFinal ({final}).',
    en: 'Date range of {days} days exceeds the PNCP limit of {max} days. Reduce the window between dataInicial ({inicial}) and dataFinal ({final}).',
  },

  // ── PNCP adapter ───────────────────────────────────────────────────
  'error.pncp_http_status': {
    pt: 'PNCP retornou HTTP {status} para {url}{suffix}',
    en: 'PNCP returned HTTP {status} for {url}{suffix}',
  },
  'error.pncp_timeout': {
    pt: 'Requisição ao PNCP excedeu o tempo limite de {timeout}ms ({url})',
    en: 'PNCP request timed out after {timeout}ms ({url})',
  },
  'error.pncp_request_failed': {
    pt: 'Requisição ao PNCP falhou ({url}): {message}',
    en: 'PNCP request failed ({url}): {message}',
  },

  // ── Server ─────────────────────────────────────────────────────────
  'error.unknown_tool': {
    pt: 'Ferramenta desconhecida: "{name}"',
    en: 'Unknown tool: "{name}"',
  },

  // ── Tool "Failed to …" ─────────────────────────────────────────────
  'error.search_licitacoes': {
    pt: 'Falha ao buscar licitações: {msg}',
    en: 'Failed to search licitações: {msg}',
  },
  'error.search_contratos': {
    pt: 'Falha ao buscar contratos: {msg}',
    en: 'Failed to search contratos: {msg}',
  },
  'error.search_atas_rp': {
    pt: 'Falha ao buscar atas RP: {msg}',
    en: 'Failed to search atas RP: {msg}',
  },
  'error.search_pca': {
    pt: 'Falha ao buscar PCA: {msg}',
    en: 'Failed to search PCA: {msg}',
  },
  'error.get_licitacao': {
    pt: 'Falha ao obter licitação: {msg}',
    en: 'Failed to get licitação: {msg}',
  },
  'error.get_contrato': {
    pt: 'Falha ao obter contrato: {msg}',
    en: 'Failed to get contrato: {msg}',
  },
  'error.get_ata_rp': {
    pt: 'Falha ao obter ata RP: {msg}',
    en: 'Failed to get ata RP: {msg}',
  },
  'error.get_orgao': {
    pt: 'Falha ao obter órgão: {msg}',
    en: 'Failed to get órgão: {msg}',
  },
  'error.get_fornecedor_contratos': {
    pt: 'Falha ao obter contratos do fornecedor: {msg}',
    en: 'Failed to get fornecedor contratos: {msg}',
  },
  'error.get_cnpj_data': {
    pt: 'Falha ao obter dados CNPJ: {msg}',
    en: 'Failed to fetch CNPJ data: {msg}',
  },
  'error.list_pca_itens': {
    pt: 'Falha ao listar itens PCA: {msg}',
    en: 'Failed to list PCA itens: {msg}',
  },
  'error.list_itens': {
    pt: 'Falha ao listar itens: {msg}',
    en: 'Failed to list itens: {msg}',
  },
  'error.list_resultados': {
    pt: 'Falha ao listar resultados: {msg}',
    en: 'Failed to list resultados: {msg}',
  },
  'error.list_arquivos': {
    pt: 'Falha ao listar arquivos: {msg}',
    en: 'Failed to list arquivos: {msg}',
  },
  'error.list_termos': {
    pt: 'Falha ao listar termos: {msg}',
    en: 'Failed to list termos: {msg}',
  },
  'error.list_instrumentos': {
    pt: 'Falha ao listar instrumentos de cobrança: {msg}',
    en: 'Failed to list instrumentos de cobrança: {msg}',
  },
  'error.aggregate': {
    pt: 'Falha ao agregar: {msg}',
    en: 'Failed to aggregate: {msg}',
  },
  'error.compare_periodos': {
    pt: 'Falha ao comparar períodos: {msg}',
    en: 'Failed to compare periodos: {msg}',
  },

  // ── compare_periodos tool unique ───────────────────────────────────
  'error.aggregate_non_text': {
    pt: 'aggregate_licitacoes retornou conteúdo não textual',
    en: 'aggregate_licitacoes returned non-text content',
  },

  // ── aggregate_licitacoes tool unique ───────────────────────────────
  'error.aggregate_date_format': {
    pt: 'Formato dataInicial/dataFinal inválido. Use YYYYMMDD.',
    en: 'Invalid dataInicial/dataFinal format. Use YYYYMMDD.',
  },
  'error.aggregate_date_order': {
    pt: 'dataInicial deve ser anterior ou igual a dataFinal.',
    en: 'dataInicial must be on or before dataFinal.',
  },
  'error.aggregate_limit': {
    pt: 'Intervalo de {days} dias excede o limite de agregação de {max} dias (~5 anos).',
    en: 'Date range of {days} days exceeds the aggregation limit of {max} days (~5 years).',
  },
  'error.aggregate_no_buckets': {
    pt: 'Nenhum bucket gerado para o intervalo informado.',
    en: 'No buckets generated for the given range.',
  },
  'error.aggregate_too_expensive': {
    pt: 'A combinação exigiria {total} buckets paginados — muito caro. Reduza o intervalo, aumente a granularidade ou limite as modalidades.',
    en: 'Combination would require {total} paginated buckets — too expensive. Reduce range, increase granularity, or limit modalities.',
  },
};

export function t(
  key: string,
  params?: Record<string, string | number | null | undefined>,
): string {
  const lang: Lang = process.env.LICINEXUS_LANG === 'en' ? 'en' : 'pt';
  const entry = messages[key];
  if (!entry) return key;
  let text = entry[lang];
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, v != null ? String(v) : '');
    }
  }
  return text;
}

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.3] - 2026-05-13

Bug fix: validar limite de 365 dias do PNCP antes de chamar a API.

### Fixed
- **#15**: `search_licitacoes`, `search_contratos`, `search_atas_rp` e `search_pca` agora validam que a janela `dataInicial..dataFinal` não excede 365 dias antes de chamar o PNCP. Janelas maiores retornavam apenas `PNCP returned HTTP 422 for /contratacoes/publicacao`, sem o corpo da mensagem do PNCP — o que dificultava o diagnóstico. Agora a tool devolve mensagem clara: `Date range of N days exceeds the PNCP limit of 365 days. Reduce the window between dataInicial (...) and dataFinal (...).`
- `describeAxiosError` agora extrai o campo `message` do corpo de erros 4xx do PNCP. A mensagem original do PNCP (ex.: `"Período inicial e final maior que 365 dias."`) aparece direto no output da tool em vez de só o status HTTP.

### Changed
- Tool descriptions de `search_licitacoes`, `search_contratos`, `search_atas_rp` e `search_pca` documentam o limite de 365 dias por chamada — assim o LLM evita tentar janelas maiores.

### Added
- `PNCP_MAX_DATE_RANGE_DAYS`, `daysBetweenPncpDates`, `validatePncpDateRange` em `src/utils/dates.ts` — utilitários reutilizáveis para validação de janela.

## [0.1.2] - 2026-05-12

Docs patch — expansão do guia de uso e clarificação do modelo stdio.

### Added
- Aviso prominente no topo de "Como usar" sobre o servidor ser **stdio-based** — não deve ser executado diretamente no terminal; é o cliente MCP (Claude Desktop, Cursor, etc.) quem invoca via JSON-RPC.
- Esclarecimento de que `npx -y @licinexusbr/mcp` **não é instalação global** — apenas baixa para o cache do npx e executa. Cliente MCP invoca toda vez que precisa; execuções subsequentes usam o cache.
- Menção que `npm exec` é equivalente a `npx`.
- Guia de configuração expandido para **7 clientes MCP**: Claude Desktop, Cursor, Continue.dev, Cline/Roo Code, Zed editor, ChatGPT (via OpenAI Agents SDK) e uso programático via `@modelcontextprotocol/sdk`.
- Seção de **troubleshooting** com 6 problemas comuns: `command not found: npx`, ferramentas não aparecem após salvar config, `EACCES`/permissões, versão antiga em cache, timeouts em consultas grandes, e como rodar com logs de debug (`LICINEXUS_LOG_LEVEL=debug`).
- Versões PT e EN do README mantidas em paralelo.

### Fixed
- **#14**: ambiguidade sobre o status do `npx` (não está obsoleto — é a forma oficial recomendada desde npm 7).

## [0.1.1] - 2026-05-11

D-day patch. Adds resiliency for PNCP outages and registers the package with the Official MCP Registry.

### Added
- `mcpName: "io.github.Licinexus/mcp"` in `package.json` — required for verification by the [Official MCP Registry](https://registry.modelcontextprotocol.io/).
- `getOrgao` now falls back to BrasilAPI CNPJ data when PNCP returns 502/503/504 or times out. Maps `razao_social`, `nome_fantasia`, `natureza_juridica`, `descricao_situacao_cadastral`, `municipio`, and `uf` into the `Orgao` schema with a `_source: "brasilapi-fallback"` marker so clients can detect degraded mode.

### Notes
- PNCP detail endpoints showed transient 502/503 errors during the v0.1.0 launch window. The fallback above keeps the most-used tool (`get_orgao`) working during PNCP backend incidents. Tools that have no public alternative still return `isError: true` with a structured error message.

## [0.1.0] - 2026-04-25

First public-ready release. Public launch pending coordinated rollout.

### Added (cumulative since 0.0.1)
- 16 tools across 6 PNCP domains + Receita Federal CNPJ enrichment
- 4 prompt templates for common analysis workflows
- 2 read-only resources (modalidades + scope)
- Smoke test against real PNCP & BrasilAPI (15/15 endpoints validated)
- Three layers of isolation from the private Licinexus codebase:
  enforced by ESLint rule, CI grep job, and physical repo separation
- DCO check on every PR
- TypeScript 6 + Node 20/22 matrix CI
- 33 unit tests, all green

### Phase breakdown
- **Phase 5** — CNPJ enrichment (1 tool), 4 prompts, 2 resources:
  - `get_cnpj_data` — public Receita Federal data via BrasilAPI (provider swappable)
  - Prompts: `analyze_edital`, `analyze_orgao`, `find_arp_opportunities`, `check_supplier`
  - Resources: `licitacao://modalidades`, `licinexus://scope`
- Smoke test script (`npm run smoke`) hitting real PNCP + BrasilAPI.

### Fixed
- PNCP `tamanhoPagina` minimum is 10 (server-side requirement); adapter now clamps and tool schemas enforce min 10.
- `getContratacao` follows PNCP's documented endpoint move from `/api/pncp/v1` to `/api/consulta/v1`.
- `Ata` schema now matches real API field names (`numeroControlePNCPAta`, `cancelado`, `vigenciaInicio/Fim`).
- `search_pca` now uses the live `/pca/atualizacao` endpoint with classification filter.
- All sub-resource list endpoints (itens, resultados, arquivos, termos, instrumentos) treat 404 as empty result, not error.
- BrasilAPI CNPJ schema accepts both string and object shapes for `porte` and `natureza_juridica`.

### Added (continued)
- **Phase 4** — Órgãos, Fornecedores, PCA (4 tools):
  - `get_orgao` — agency profile
  - `get_fornecedor_contratos` — public contracts of a CNPJ as supplier
  - `search_pca` — Plano de Contratação Anual (forward-looking spend signal)
  - `list_pca_itens` — items planned by an agency for a given year
- **Phase 3** — Atas de Registro de Preço (2 tools):
  - `search_atas_rp` — search ARPs, filter to active only by default
  - `get_ata_rp` — full ARP details + items + arquivos in one shot
- **Phase 2** — Contratos + Termos + Instrumentos (4 tools):
  - `search_contratos` — by date range, agency CNPJ, supplier CNPJ, value
  - `get_contrato` — full contract details
  - `list_contrato_termos` — additive terms (extensions, value changes)
  - `list_contrato_instrumentos` — billing instruments (NFes, faturas)
- **Phase 1** — PNCP adapter and 5 tools for `compras/licitações`:
  - `search_licitacoes` — query by date, modality, UF, CNPJ, value, keyword
  - `get_licitacao` — fetch single bid by PNCP control number or components
  - `list_licitacao_itens` — list items of a bid
  - `list_licitacao_resultados` — list bidding results for a specific item
  - `list_licitacao_arquivos` — list files attached to a bid
- In-memory LRU cache (TTL 5–30 min) for PNCP responses.
- Modalidade reference table (Lei 14.133 codes 1–13).
- Initial project scaffold (Phase 0).
- TypeScript + MCP SDK setup.
- Governance: MIT, DCO, Code of Conduct, Security policy.
- CI workflow (lint, typecheck, test).
- Lint rule preventing imports from private Licinexus packages.

## [0.0.1] - 2026-04-25

- Repository created.

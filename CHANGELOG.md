# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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

# Architecture

## The protection model

This MCP server is open-source, but the broader [Licinexus](https://licinexus.com.br) product is not. The two are deliberately and physically isolated by three walls:

```
┌─────────────────────────────────┐
│  @licinexusbr/mcp (this repo)   │──► PNCP, BrasilAPI (HTTPS, public)
│  • MIT licensed                 │
│  • Public, anyone can fork      │
└─────────────────────────────────┘
            (same upstream APIs)
┌─────────────────────────────────┐
│  Licinexus internal             │──► same public APIs
│  • licita-core (collector)      │    + caching + cron
│  • licita-api (product)         │    + enrichment
│  • licita-match (matching)      │    + AI processing
│  • Private, never exposed       │
└─────────────────────────────────┘
```

### Wall 1 — Architectural

This MCP **never** calls any Licinexus internal API or database. It hits the public upstream sources directly (PNCP, BrasilAPI). The internal Licinexus stack is invisible to it.

If a future PR ever proposes "let's call the Licinexus cache for speed" — **reject it**. That would collapse the entire protection model.

### Wall 2 — Scope

The MCP intentionally stops at "raw, structured, public data". It does not include:

- The Licinexus matching engine
- Supplier scoring or analytics (`fornecedor_analytics`, `fornecedor_comportamento`)
- The unified price database (`banco_precos_unificado`)
- AI-generated artifacts (auto-generated atas, declarations, proposals)
- Any customer data
- Any portal credentials or private data sources

The user gets a list of bids; the user does not get "which 3 to bid on with what proposal". That gap is where the Licinexus product lives.

### Wall 3 — Branding & licensing

- License: **MIT** — anyone can use, fork, sublicense.
- Package scope: `@licinexusbr/*` on npm — the scope is owned by Licinexus and cannot be squatted.
- Every server response carries `serverInfo.name = "licinexus-mcp"` and credits the project to Licinexus.

This means the MCP can be remixed freely (good for adoption), but the brand association is permanent (good for authority/funnel).

## Data sources

Currently planned:

| Source | URL | Type | Auth |
| --- | --- | --- | --- |
| **PNCP** (Portal Nacional de Contratações Públicas) | `https://pncp.gov.br/api/consulta/v1`, `https://pncp.gov.br/api/pncp/v1` | REST (public) | none |
| **BrasilAPI** (CNPJ enrichment) | `https://brasilapi.com.br/api/cnpj/v1` | REST (public) | none |

See [`data-sources.md`](data-sources.md) for endpoint-by-endpoint mapping.

## Caching

Per-user local cache via SQLite (default location: `~/.cache/licinexus-mcp/`). Short TTL (5–60 min depending on endpoint). No shared cache across users.

The cache is purely a courtesy to upstream APIs and to keep response times snappy. Users can disable it via env var.

## Adapter pattern

Each upstream API gets its own adapter under `src/adapters/`. Adapters are thin wrappers that:

1. Compose the upstream URL with validated parameters.
2. Hit the API with a sane timeout + retry.
3. Validate the response shape with Zod.
4. Normalize to a consistent internal type.

The CNPJ adapter is **swappable** via env var (`CNPJ_PROVIDER=brasilapi|minhareceita|...`). This means we can switch providers (or one day point to a Licinexus-hosted public CNPJ endpoint) without touching tool code.

## Tools / Resources / Prompts

- **Tools** under `src/tools/` — actions the LLM can invoke.
- **Resources** under `src/schemas/` for static reference data (CNAE taxonomy, modalidade tables).
- **Prompts** under `src/prompts/` — preset templates (analyze edital, summarize, etc.).

Each tool's input is a Zod schema; each tool's output is normalized JSON. Errors are returned as structured errors, never as silent empty results.

## What's NOT here, by design

- No database (other than the local cache).
- No background jobs / cron / queues.
- No authentication (all upstream APIs are anonymous).
- No telemetry phoning home to Licinexus.
- No imports from `licita-*` private packages — enforced by ESLint and CI.

# Data Sources

All data exposed by this MCP comes from **public, anonymous Brazilian government APIs and well-known public aggregators**. This document maps each source.

## PNCP — Portal Nacional de Contratações Públicas

**Base URLs:**
- `https://pncp.gov.br/api/consulta/v1` — search/listing
- `https://pncp.gov.br/api/pncp/v1` — detail endpoints

**License/Terms:** Public data per Lei 14.133/2021 and Lei de Acesso à Informação (12.527/2011).

### Domains we plan to expose

| Domain | Endpoints | Status |
| --- | --- | --- |
| **Compras / Editais** | `/contratacoes/publicacao`, `/contratacoes/proposta`, `/orgaos/{cnpj}/compras/{ano}/{seq}` | Planned (Phase 1) |
| **Itens & Resultados** | `/orgaos/{cnpj}/compras/{ano}/{seq}/itens`, `.../resultados` | Planned (Phase 1) |
| **Arquivos** | `/orgaos/{cnpj}/compras/{ano}/{seq}/arquivos` | Planned (Phase 2) |
| **Contratos** | `/contratos`, `/contratos/atualizacao` | Planned (Phase 2) |
| **Termos Aditivos** | `/orgaos/{cnpj}/contratos/{ano}/{seq}/termos` | Planned (Phase 2) |
| **Instrumentos de Cobrança (NFes)** | `/orgaos/{cnpj}/contratos/{ano}/{seq}/instrumentocobranca` | Planned (Phase 2) |
| **Atas RP** | `/atas`, `/orgaos/{cnpj}/compras/{ano}/{seq}/atas/{seq_ata}` | Planned (Phase 3) |
| **Órgãos** | `/orgaos/{cnpj}` | Planned (Phase 4) |
| **PCA (Plano de Contratação Anual)** | `/pca/`, `/orgaos/{cnpj}/pca/{ano}/{seq}/itens` | Planned (Phase 4) |

## Receita Federal CNPJ (via aggregator)

We do **not** ship the Receita Federal monthly dump (~15GB) — that's appropriate for a server-side collector but not for an end-user MCP install. Instead, we wrap a public aggregator API:

**Default provider:** [BrasilAPI](https://brasilapi.com.br) — `https://brasilapi.com.br/api/cnpj/v1/{cnpj}`

**License/Terms:** Public data from Receita Federal Dados Abertos. BrasilAPI is community-maintained and free.

**Swappable:** users can override via `CNPJ_PROVIDER` env var. Future versions may support `minhareceita`, `cnpja`, or a Licinexus-hosted public endpoint.

## What we do NOT use

- **No paywalled APIs**
- **No scraped data behind auth or CAPTCHAs**
- **No private Licinexus database or API** — see [architecture.md](architecture.md)
- **No customer data**

## Updating this list

New data sources require an issue with the `data-source` label, scope review, and a maintainer's sign-off. The bar:

1. Source is genuinely public.
2. Source has stable terms of service (or is government-mandated open data).
3. Adding the source doesn't blur the line with the Licinexus paid product.

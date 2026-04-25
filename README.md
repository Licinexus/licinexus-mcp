# @licinexusbr/mcp

> **Status: 🚧 Early development (v0.0.1)** — scaffolding only, no tools implemented yet. Watch this repo for the MVP release.

Conversational access to Brazilian public procurement data (PNCP + Receita Federal) via the [Model Context Protocol](https://modelcontextprotocol.io). Maintained by [Licinexus](https://licinexus.com.br).

Talk to 200k+ Brazilian public bids, contracts, price-registry agreements (atas RP), planning records (PCA) and supplier data — directly from Claude Desktop, Cursor, Continue, or any MCP-compatible client.

---

## Why

Brazil's public procurement data is fully public via [PNCP](https://pncp.gov.br) and the Receita Federal CNPJ datasets, but the APIs are awkward to consume from an LLM. This MCP wraps the most useful endpoints with sensible filters, pagination, and Zod-validated schemas so an assistant can answer questions like:

- *"Quais editais de TI no Sudeste com valor acima de R$ 500k publicados nos últimos 7 dias?"*
- *"Existe ata de registro de preço vigente com saldo para `notebook` no estado de SP?"*
- *"Qual o histórico de contratos do CNPJ X com órgãos públicos federais?"*
- *"O que a Prefeitura de Y planeja comprar este ano segundo o PCA?"*

## Install

> **Not yet published to npm.** When v0.1.0 ships, install will be:

```bash
# coming soon
npx @licinexusbr/mcp
```

Then configure your MCP client (Claude Desktop example):

```json
{
  "mcpServers": {
    "licinexus": {
      "command": "npx",
      "args": ["-y", "@licinexusbr/mcp"]
    }
  }
}
```

## Roadmap

- [x] **Phase 0** — Scaffold, governance, CI
- [x] **Phase 1** — PNCP search/get for licitações (compras): 5 tools
- [x] **Phase 2** — Contratos + Termos Aditivos + Instrumentos de Cobrança: 4 tools
- [x] **Phase 3** — Atas de Registro de Preço + saldos: 2 tools
- [x] **Phase 4** — Órgãos + Fornecedores + PCA: 4 tools
- [x] **Phase 5** — CNPJ via BrasilAPI + 4 prompts + 2 resources
- [x] **Smoke test** — 15/15 endpoints validated against real PNCP & BrasilAPI
- [ ] **Phase 6** — Public launch

### Tools available (15)

**Compras / Licitações**
| Tool | Description |
| --- | --- |
| `search_licitacoes` | Search bids by date, modality, UF, agency CNPJ, value, keyword |
| `get_licitacao` | Full details of a bid by PNCP control number |
| `list_licitacao_itens` | Items (lots) of a bid |
| `list_licitacao_resultados` | Bidding results per item (winners, prices) |
| `list_licitacao_arquivos` | Edital files (PDFs, attachments) |

**Contratos**
| Tool | Description |
| --- | --- |
| `search_contratos` | Search contracts by date, agency, supplier, value |
| `get_contrato` | Full contract details |
| `list_contrato_termos` | Additive terms (extensions, value changes) |
| `list_contrato_instrumentos` | Billing instruments (NFes, faturas) |

**Atas de Registro de Preço**
| Tool | Description |
| --- | --- |
| `search_atas_rp` | Search ARPs (active only by default) |
| `get_ata_rp` | Full ARP details + items + files in one call |

**Órgãos / Fornecedores / PCA**
| Tool | Description |
| --- | --- |
| `get_orgao` | Public agency profile (poder, esfera, juridical nature) |
| `get_fornecedor_contratos` | Public contracts of a CNPJ as supplier |
| `search_pca` | Plano de Contratação Anual (forward-looking spend) |
| `list_pca_itens` | Planned items of a specific PCA |

## Scope

### ✅ What this MCP does
- Wraps **public** Brazilian government APIs (PNCP, BrasilAPI for CNPJ).
- Returns raw structured data — the LLM does the analysis.
- Caches read-heavy responses locally (SQLite, per user, short TTL).

### ❌ What this MCP does NOT do
- It does **not** call any private Licinexus infrastructure or database.
- It does **not** include the Licinexus matching engine, supplier scoring, price aggregation, generated artifacts, or any proprietary data.
- It is **not** a replacement for the [Licinexus](https://licinexus.com.br) product — it's a complementary open-source tool for accessing the public layer of the same data.

See [docs/architecture.md](docs/architecture.md) for the full separation model.

## Contributing

PRs welcome under [DCO](https://developercertificate.org/) (Developer Certificate of Origin). Sign your commits with `git commit --signoff`.

Please **open an issue first** to discuss any non-trivial change. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Support

This is a community project. **Best-effort, no SLA.** Issues triaged within 7 days when possible. For Licinexus product questions (matching, alerts, gestão de propostas), please contact us at [licinexus.com.br](https://licinexus.com.br).

## Security

Found a vulnerability? See [SECURITY.md](SECURITY.md) for responsible disclosure.

## License

MIT © Licinexus. See [LICENSE](LICENSE).

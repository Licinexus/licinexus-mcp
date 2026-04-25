<p align="center">
  <a href="https://licinexus.com.br">
    <img src=".github/assets/logo.png" alt="Licinexus" width="380">
  </a>
</p>

<h1 align="center">@licinexusbr/mcp</h1>

<p align="center">
  Conversational access to Brazilian public procurement data — directly from Claude Desktop, Cursor, Continue, or any MCP-compatible client.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT"></a>
  <a href="https://developercertificate.org/"><img src="https://img.shields.io/badge/DCO-required-green.svg" alt="DCO"></a>
  <a href="https://pncp.gov.br"><img src="https://img.shields.io/badge/data-PNCP%20%2B%20Receita%20Federal-yellow.svg" alt="PNCP + Receita"></a>
  <a href="https://www.npmjs.com/package/@licinexusbr/mcp"><img src="https://img.shields.io/npm/v/@licinexusbr/mcp.svg?label=npm" alt="npm"></a>
</p>

<p align="center">
  Maintained by <a href="https://licinexus.com.br"><b>Licinexus</b></a> as an open-source contribution to the Brazilian govtech ecosystem.
</p>

<p align="center">
  <img src=".github/assets/demo.gif" alt="Demo: Claude conversando com licitações via MCP" width="900">
</p>

---

## What it does

Wraps the most useful endpoints of the **Portal Nacional de Contratações Públicas (PNCP)** and **Receita Federal CNPJ** data so an LLM can answer real questions about Brazilian public procurement:

- *"Quais editais de TI no Sudeste publicados nos últimos 7 dias com valor acima de R$ 500k?"*
- *"Existe ata de registro de preço vigente com saldo para `notebook` no estado de SP?"*
- *"Qual o histórico de contratos do CNPJ X com órgãos públicos federais nos últimos 2 anos?"*
- *"O que a Prefeitura de Y planeja comprar este ano segundo o PCA?"*
- *"Resuma este edital e me dê um checklist de viabilidade."*

## Install

```bash
npx @licinexusbr/mcp
```

That's it — no compilation, no database setup, no auth tokens. The server hits public APIs directly.

### Configuration

**Claude Desktop** — add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

**Cursor / Continue / other MCP clients** — same shape, see your client's docs for the config file location.

Restart your MCP client. The 16 tools and 4 prompts will be available.

## Tools (16)

### Compras / Licitações
| Tool | What it does |
| --- | --- |
| `search_licitacoes` | Search bids by date, modality, UF, agency CNPJ, value, keyword |
| `get_licitacao` | Full details of a bid by PNCP control number |
| `list_licitacao_itens` | Items (lots) of a bid: descriptions, quantities, values |
| `list_licitacao_resultados` | Bidding results per item: winners, prices, suppliers |
| `list_licitacao_arquivos` | Edital files (PDFs, attachments, terms of reference) |

### Contratos
| Tool | What it does |
| --- | --- |
| `search_contratos` | Search contracts by date, agency, supplier, value |
| `get_contrato` | Full contract details |
| `list_contrato_termos` | Additive terms (extensions, value/term changes) |
| `list_contrato_instrumentos` | Billing instruments (NFes, faturas) |

### Atas de Registro de Preço
| Tool | What it does |
| --- | --- |
| `search_atas_rp` | Search ARPs — active only by default. Find usable contracts. |
| `get_ata_rp` | Full ARP details + items (with available balance) + files |

### Órgãos / Fornecedores / PCA
| Tool | What it does |
| --- | --- |
| `get_orgao` | Public agency profile (poder, esfera, juridical nature) |
| `get_fornecedor_contratos` | Public contracts of a CNPJ as supplier |
| `search_pca` | Plano de Contratação Anual — forward-looking spend signal |
| `list_pca_itens` | Planned items of a specific PCA |

### CNPJ enrichment
| Tool | What it does |
| --- | --- |
| `get_cnpj_data` | Receita Federal cadastro (CNAEs, sócios, capital, situação) via [BrasilAPI](https://brasilapi.com.br) (default) or MinhaReceita (`CNPJ_PROVIDER=minhareceita`) |

## Prompt templates (4)

Pre-built workflows your assistant can invoke directly:

| Prompt | What it does |
| --- | --- |
| `analyze_edital` | Viability checklist for a public bid |
| `analyze_orgao` | 360° profile of a public agency |
| `find_arp_opportunities` | Find active ARPs with available balance for a keyword |
| `check_supplier` | Basic public-data check on a supplier CNPJ |

## Resources (2)

| URI | Content |
| --- | --- |
| `licitacao://modalidades` | PNCP modality reference table (Lei 14.133) |
| `licinexus://scope` | What this MCP does and does not do |

## Example session

```
You:    Tem alguma ata de registro de preço vigente para notebooks?
Claude: [calls search_atas_rp with palavraChave="notebook", somenteVigentes=true]
        Encontrei 12 atas vigentes mencionando notebooks. As 3 mais relevantes:
        1. Ministério da Justiça — vigência até 2026-12-31, valor estimado R$ 2.4M
        2. Prefeitura de São Paulo — vigência até 2026-09-30...

You:    Detalhes da primeira, com saldos por item?
Claude: [calls get_ata_rp includeItens=true]
        - Item 1: Notebook tipo I (16GB RAM, 512GB SSD) — saldo 1.200 unid, R$ 4.800/un
        - Item 2: Notebook tipo II ...
```

## Roadmap

- [x] Phase 0 — Scaffold, governance, CI
- [x] Phase 1 — Licitações (5 tools)
- [x] Phase 2 — Contratos + Aditivos + NFes (4 tools)
- [x] Phase 3 — Atas RP (2 tools)
- [x] Phase 4 — Órgãos + Fornecedores + PCA (4 tools)
- [x] Phase 5 — CNPJ + 4 prompts + 2 resources (1 tool)
- [x] Smoke test against real APIs (15/15 endpoints)
- [ ] Phase 6 — Public launch (Show HN, Discord, awesome-lists)

## Scope

### What this MCP does
- Wraps **public** Brazilian government APIs (PNCP, BrasilAPI).
- Returns raw structured data — the LLM does the analysis.
- Caches read-heavy responses locally (in-memory LRU, short TTL).

### What this MCP does NOT do
- Does **not** call any private Licinexus infrastructure or database.
- Does **not** include the Licinexus matching engine, supplier scoring, price aggregation, generated artifacts, or any proprietary data.
- Is **not** a replacement for the [Licinexus](https://licinexus.com.br) product — it's a complementary open-source tool for the public layer of the same data.

See [docs/architecture.md](docs/architecture.md) for the full three-wall separation model.

## Need automatic matching, alerts, or proposal management?

The Licinexus product builds on top of these public sources with proprietary matching, scoring, and AI-generated artifacts. **This MCP intentionally does not replicate those features.**

→ <https://licinexus.com.br>

## Contributing

PRs welcome under [DCO](https://developercertificate.org/) (Developer Certificate of Origin) — sign your commits with `git commit --signoff`.

Please **open an issue first** to discuss any non-trivial change. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Support

Community project. **Best-effort, no SLA.** Issues triaged within 7 days when possible.

For paid support and product features, see [licinexus.com.br](https://licinexus.com.br).

## Security

Found a vulnerability? See [SECURITY.md](SECURITY.md) for responsible disclosure (do not open public issues).

## License

MIT © Licinexus. See [LICENSE](LICENSE).

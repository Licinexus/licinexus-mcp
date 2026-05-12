<p align="right">
  🇧🇷 <a href="README.md"><b>Versão em português</b></a>  ·  🇺🇸 English
</p>

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

<!-- BEGIN: hero demo (replace .github/assets/demo-claude.gif before public launch — see scripts/record-claude-gif.md) -->
<p align="center">
  <img src=".github/assets/demo.gif" alt="Demo: Licinexus MCP em ação contra PNCP + Receita Federal" width="900">
</p>
<!-- END: hero demo -->

> 📺 **Demo above** is a CLI script calling the same adapters the LLM uses, against live PNCP & BrasilAPI. The Claude Desktop / Cursor experience looks identical — same tools, same data, with the LLM doing the natural-language interpretation.

---

## What it does

Wraps the most useful endpoints of the **Portal Nacional de Contratações Públicas (PNCP)** and **Receita Federal CNPJ** data so an LLM can answer real questions about Brazilian public procurement:

- _"Quais editais de TI no Sudeste publicados nos últimos 7 dias com valor acima de R$ 500k?"_
- _"Existe ata de registro de preço vigente com saldo para `notebook` no estado de SP?"_
- _"Qual o histórico de contratos do CNPJ X com órgãos públicos federais nos últimos 2 anos?"_
- _"O que a Prefeitura de Y planeja comprar este ano segundo o PCA?"_
- _"Resuma este edital e me dê um checklist de viabilidade."_

## 🚀 How to use

### Prerequisites

- **Node.js 18 or later** installed ([nodejs.org](https://nodejs.org))
- Any MCP-compatible client (list below)

No API keys, no registration, no local database — the server hits public endpoints directly.

---

### 1. Claude Desktop ⭐ (recommended)

#### Path A — Via UI (Claude Desktop ≥ 4.x)

1. Open **Claude Desktop**
2. `Cmd + ,` (macOS) or `Ctrl + ,` (Windows) → **Settings**
3. Sidebar → **Connectors**
4. Click **"Edit Configuration"** (Desktop app → Developer)
5. Open `claude_desktop_config.json` in your editor

Replace (or add inside `mcpServers`):

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

6. Save the file (`Cmd+S`)
7. **Quit Claude completely** (`Cmd+Q` — not just close the window) and reopen

#### Path B — Editing the file directly

| OS          | Path                                                              |
| ----------- | ----------------------------------------------------------------- |
| **macOS**   | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json`                     |
| **Linux**   | _Not officially supported by Claude Desktop yet_                  |

#### How to verify it worked

After reopening, in a new conversation:

- In **Settings → Connectors → licinexus**, you should see **16 tools** listed (`search_licitacoes`, `get_cnpj_data`, etc.)
- In the prompt field, type:

```
What licinexus tools do you have available?
```

Claude should list the 16 tools. You can proceed.

#### First prompts to try

```
Show me the registration data for CNPJ 00000000000191 (Banco do Brasil)
```

```
Are there active price-registry agreements for laptops in São Paulo with available balance?
```

```
What does the city of Juiz de Fora plan to buy this year according to the PCA?
```

```
Which IT bids were published in the last 7 days above R$ 200k?
```

---

### 2. Cursor

Cursor supports MCP servers natively. Create/edit the file `~/.cursor/mcp.json`:

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

Or via UI: **Cursor → Settings → MCP → Add new MCP server**.

Restart Cursor. The tools appear in the Composer chat.

---

### 3. Continue.dev (VS Code / JetBrains)

Edit the file `~/.continue/config.json` (or `config.yaml`):

```json
{
  "mcpServers": [
    {
      "name": "licinexus",
      "command": "npx",
      "args": ["-y", "@licinexusbr/mcp"]
    }
  ]
}
```

Reload Continue (`Cmd+Shift+P` → "Continue: Reload"). The tools become available in chat.

---

### 4. Cline / Roo Code (VS Code extension)

Via the Cline UI:

1. Open the Cline extension in the VS Code sidebar
2. Settings icon → **MCP Servers** → **Edit MCP Settings**
3. Add:

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

---

### 5. Zed editor

Edit `~/.config/zed/settings.json` (macOS/Linux) and add:

```json
{
  "context_servers": {
    "licinexus": {
      "command": {
        "path": "npx",
        "args": ["-y", "@licinexusbr/mcp"]
      }
    }
  }
}
```

Restart Zed.

---

### 6. ChatGPT

**ChatGPT consumer (web)** doesn't natively support stdio MCP at the moment. But you can use it via:

#### Via OpenAI Agents SDK (Python)

```python
from openai import OpenAI
from openai.agents import Agent, MCPServerStdio

server = MCPServerStdio(
    command="npx",
    args=["-y", "@licinexusbr/mcp"]
)

agent = Agent(
    name="Licinexus Assistant",
    instructions="You are a Brazilian public procurement analyst.",
    mcp_servers=[server]
)
```

#### ChatGPT Desktop

Recent versions have limited MCP support — check OpenAI's official docs for current status.

---

### 7. Programmatically (any LLM via stdio)

You can call the server directly via stdio in any language that supports MCP's JSON-RPC protocol. Node example:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'npx',
  args: ['-y', '@licinexusbr/mcp'],
});

const client = new Client({ name: 'my-app', version: '1.0.0' }, { capabilities: {} });
await client.connect(transport);

const tools = await client.listTools();
console.log(tools);

const result = await client.callTool({
  name: 'search_atas_rp',
  arguments: { palavraChave: 'notebook', somenteVigentes: true },
});
```

---

## 🔧 Troubleshooting

### "Server failed to start" or "command not found: npx"

**Cause:** Claude Desktop / other client can't find `npx` in `PATH`.

**Fix:** use the absolute path. Find it with:

```bash
which npx
```

And replace in the config:

```json
{
  "mcpServers": {
    "licinexus": {
      "command": "/opt/homebrew/bin/npx",
      "args": ["-y", "@licinexusbr/mcp"]
    }
  }
}
```

### "Tools don't appear after saving config"

**Fix:** restart the client **completely**. On Mac, `Cmd+Q` (closing the window isn't enough). MCP servers are only loaded at startup.

### "EACCES" or permission errors

**Cause:** `npx` cache corrupted or write permissions.

**Fix:**

```bash
npm cache clean --force
npx -y @licinexusbr/mcp
```

### Old version being executed

**Cause:** `npx` keeps a cache. To force the latest version:

```bash
npx -y @licinexusbr/mcp@latest
```

And in the config:

```json
"args": ["-y", "@licinexusbr/mcp@latest"]
```

### Timeouts on large queries

Some queries (broad keywords, long date ranges) can take a while — PNCP sometimes takes 15-30s to respond. The server already implements a retry budget. If it persists, narrow the query with more specific filters.

### Logs and debug

To inspect requests/responses, run manually in the terminal:

```bash
LICINEXUS_LOG_LEVEL=debug npx -y @licinexusbr/mcp
```

In another window, watch the logs while the client makes calls.

## Tools (16)

### Compras / Licitações

| Tool                        | What it does                                                   |
| --------------------------- | -------------------------------------------------------------- |
| `search_licitacoes`         | Search bids by date, modality, UF, agency CNPJ, value, keyword |
| `get_licitacao`             | Full details of a bid by PNCP control number                   |
| `list_licitacao_itens`      | Items (lots) of a bid: descriptions, quantities, values        |
| `list_licitacao_resultados` | Bidding results per item: winners, prices, suppliers           |
| `list_licitacao_arquivos`   | Edital files (PDFs, attachments, terms of reference)           |

### Contratos

| Tool                         | What it does                                      |
| ---------------------------- | ------------------------------------------------- |
| `search_contratos`           | Search contracts by date, agency, supplier, value |
| `get_contrato`               | Full contract details                             |
| `list_contrato_termos`       | Additive terms (extensions, value/term changes)   |
| `list_contrato_instrumentos` | Billing instruments (NFes, faturas)               |

### Atas de Registro de Preço

| Tool             | What it does                                                 |
| ---------------- | ------------------------------------------------------------ |
| `search_atas_rp` | Search ARPs — active only by default. Find usable contracts. |
| `get_ata_rp`     | Full ARP details + items (with available balance) + files    |

### Órgãos / Fornecedores / PCA

| Tool                       | What it does                                              |
| -------------------------- | --------------------------------------------------------- |
| `get_orgao`                | Public agency profile (poder, esfera, juridical nature)   |
| `get_fornecedor_contratos` | Public contracts of a CNPJ as supplier                    |
| `search_pca`               | Plano de Contratação Anual — forward-looking spend signal |
| `list_pca_itens`           | Planned items of a specific PCA                           |

### CNPJ enrichment

| Tool            | What it does                                                                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get_cnpj_data` | Receita Federal cadastro (CNAEs, sócios, capital, situação) via [BrasilAPI](https://brasilapi.com.br) (default) or MinhaReceita (`CNPJ_PROVIDER=minhareceita`) |

## Prompt templates (4)

Pre-built workflows your assistant can invoke directly:

| Prompt                   | What it does                                          |
| ------------------------ | ----------------------------------------------------- |
| `analyze_edital`         | Viability checklist for a public bid                  |
| `analyze_orgao`          | 360° profile of a public agency                       |
| `find_arp_opportunities` | Find active ARPs with available balance for a keyword |
| `check_supplier`         | Basic public-data check on a supplier CNPJ            |

## Resources (2)

| URI                       | Content                                    |
| ------------------------- | ------------------------------------------ |
| `licitacao://modalidades` | PNCP modality reference table (Lei 14.133) |
| `licinexus://scope`       | What this MCP does and does not do         |

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
- [x] **Phase 6 — Public launch** (2026-05-11 · v0.1.0 on [npm](https://www.npmjs.com/package/@licinexusbr/mcp))
- [ ] Phase 7 — Community adapters (state TCE/TCM, legacy ComprasNet)

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

<p align="right">
  🇧🇷 Português  ·  🇺🇸 <a href="README.en.md"><b>English version</b></a>
</p>

<p align="center">
  <a href="https://licinexus.com.br">
    <img src=".github/assets/logo.png" alt="Licinexus" width="380">
  </a>
</p>

<h1 align="center">@licinexusbr/mcp</h1>

<p align="center">
  Acesso conversacional aos dados de licitações públicas brasileiras — direto do Claude Desktop, Cursor, Continue ou qualquer cliente compatível com MCP.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/licença-MIT-blue.svg" alt="MIT"></a>
  <a href="https://developercertificate.org/"><img src="https://img.shields.io/badge/DCO-obrigatório-green.svg" alt="DCO"></a>
  <a href="https://pncp.gov.br"><img src="https://img.shields.io/badge/dados-PNCP%20%2B%20Receita%20Federal-yellow.svg" alt="PNCP + Receita"></a>
  <a href="https://www.npmjs.com/package/@licinexusbr/mcp"><img src="https://img.shields.io/npm/v/@licinexusbr/mcp.svg?label=npm" alt="npm"></a>
</p>

<p align="center">
  Mantido pela <a href="https://licinexus.com.br"><b>Licinexus</b></a> como contribuição open source ao ecossistema brasileiro de govtech.
</p>

<!-- BEGIN: hero demo -->
<p align="center">
  <img src=".github/assets/demo.gif" alt="Demo: Licinexus MCP em ação contra PNCP + Receita Federal" width="900">
</p>
<!-- END: hero demo -->

> 📺 **A demonstração acima** é um script CLI chamando os mesmos adaptadores que o LLM usa, contra PNCP e BrasilAPI ao vivo. A experiência no Claude Desktop / Cursor é idêntica — mesmas ferramentas, mesmos dados, com o LLM fazendo a interpretação em linguagem natural.

---

## O que faz

Encapsula os endpoints mais úteis do **Portal Nacional de Contratações Públicas (PNCP)** e dos dados de CNPJ da **Receita Federal**, para que um LLM consiga responder perguntas reais sobre contratações públicas brasileiras:

- _"Quais editais de TI no Sudeste publicados nos últimos 7 dias com valor acima de R$ 500 mil?"_
- _"Existe ata de registro de preço vigente com saldo para `notebook` no estado de SP?"_
- _"Qual o histórico de contratos do CNPJ X com órgãos públicos federais nos últimos 2 anos?"_
- _"O que a Prefeitura de Y planeja comprar este ano segundo o PCA?"_
- _"Resuma este edital e me dê uma lista de verificação de viabilidade."_

## 🚀 Como usar

### Pré-requisitos

- **Node.js 18 ou superior** instalado ([nodejs.org](https://nodejs.org))
- Qualquer cliente compatível com MCP (lista abaixo)

Nenhuma chave de API, nenhum cadastro, nenhum banco local — o servidor consulta endpoints públicos diretamente.

> ⚠️ **Importante:** Este é um servidor MCP **stdio-based**. Você **não** roda ele diretamente no terminal — é o **cliente MCP** (Claude Desktop, Cursor, etc.) que invoca o servidor quando precisa, e a comunicação acontece por JSON-RPC via stdin/stdout. Se você executar `npx @licinexusbr/mcp` direto no terminal, vai parecer que "travou" — é normal, o servidor está esperando o cliente conectar.
>
> Da mesma forma, `npx -y @licinexusbr/mcp` **não é uma instalação global** — apenas baixa o pacote pra um cache local (`~/.npm/_npx/`) e executa. O cliente MCP invoca `npx` toda vez que precisa do servidor; execuções subsequentes usam o cache e são instantâneas. (Você também pode usar `npm exec` em vez de `npx` — são equivalentes.)

---

### 1. Claude Desktop ⭐ (recomendado)

#### Caminho A — Via UI (Claude Desktop ≥ 4.x)

1. Abra o **Claude Desktop**
2. `Cmd + ,` (macOS) ou `Ctrl + ,` (Windows) → **Configurações**
3. Barra lateral → **Conectores**
4. Clica em **"Editar Configuração"** (Aplicativo desktop → Desenvolvedor)
5. Abre o arquivo `claude_desktop_config.json` no seu editor

Substitua (ou adicione dentro de `mcpServers`):

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

6. Salve o arquivo (`Cmd+S`)
7. **Encerre o Claude completamente** (`Cmd+Q` — não basta fechar a janela) e reabra

#### Caminho B — Editando o arquivo direto

| SO          | Caminho                                                           |
| ----------- | ----------------------------------------------------------------- |
| **macOS**   | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json`                     |
| **Linux**   | _Não oficialmente suportado pelo Claude Desktop ainda_            |

#### Como verificar que funcionou

Após reabrir, na conversa nova:

- Em **Configurações → Conectores → licinexus**, você deve ver **16 ferramentas** listadas (`search_licitacoes`, `get_cnpj_data`, etc.)
- No campo de prompt, digite:

```
Quais ferramentas do licinexus você tem disponíveis?
```

O Claude deve listar as 16 ferramentas. Pode prosseguir.

#### Primeiros prompts para testar

```
Me mostra os dados do CNPJ 00000000000191 (Banco do Brasil)
```

```
Tem ata de registro de preço vigente para notebook em São Paulo com saldo disponível?
```

```
O que a Prefeitura de Juiz de Fora planeja comprar este ano segundo o PCA?
```

```
Quais editais de tecnologia da informação foram publicados nos últimos 7 dias acima de R$ 200 mil?
```

---

### 2. Cursor

Cursor suporta MCP servers nativamente. Crie/edite o arquivo `~/.cursor/mcp.json`:

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

Ou via UI: **Cursor → Settings → MCP → Add new MCP server**.

Reinicie o Cursor. As ferramentas aparecem no chat do Composer.

---

### 3. Continue.dev (VS Code / JetBrains)

Edite o arquivo `~/.continue/config.json` (ou `config.yaml`):

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

Recarregue o Continue (`Cmd+Shift+P` → "Continue: Reload"). As ferramentas ficam disponíveis no chat.

---

### 4. Cline / Roo Code (extensão VS Code)

Pela UI do Cline:

1. Abra a extensão Cline na sidebar do VS Code
2. Ícone de configurações → **MCP Servers** → **Edit MCP Settings**
3. Adicione:

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

Edite `~/.config/zed/settings.json` (macOS/Linux) e adicione:

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

Reinicie o Zed.

---

### 6. ChatGPT

O **ChatGPT consumer (web)** não suporta MCP stdio nativamente até o momento. Mas dá pra usar via:

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
    instructions="Você é um analista de licitações públicas brasileiras.",
    mcp_servers=[server]
)
```

#### ChatGPT Desktop

Versões recentes têm suporte limitado a MCP — verifique a documentação oficial da OpenAI para o estado atual.

---

### 7. Programaticamente (qualquer LLM via stdio)

Você pode chamar o servidor diretamente via stdio em qualquer linguagem que suporte o protocolo JSON-RPC do MCP. Exemplo Node:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'npx',
  args: ['-y', '@licinexusbr/mcp'],
});

const client = new Client({ name: 'meu-app', version: '1.0.0' }, { capabilities: {} });
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

### "Server failed to start" ou "command not found: npx"

**Causa:** Claude Desktop / outro cliente não acha o `npx` no `PATH`.

**Solução:** use o caminho absoluto. Descubra com:

```bash
which npx
```

E substitua no config:

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

### "Ferramentas não aparecem após salvar config"

**Solução:** reinicie o cliente **completamente**. No Mac, `Cmd+Q` (não basta fechar a janela). MCP servers só são carregados na inicialização.

### "EACCES" ou erro de permissão

**Causa:** cache do `npx` corrompido ou permissão de escrita.

**Solução:**

```bash
npm cache clean --force
npx -y @licinexusbr/mcp
```

### Versão antiga sendo executada

**Causa:** `npx` mantém cache. Para forçar a versão mais recente:

```bash
npx -y @licinexusbr/mcp@latest
```

E no config:

```json
"args": ["-y", "@licinexusbr/mcp@latest"]
```

### Timeout em consultas grandes

Algumas consultas (busca por palavra-chave ampla, datas longas) podem demorar — o PNCP às vezes leva 15-30s para responder. O servidor já implementa retry budget. Se persistir, refine a consulta com filtros mais específicos.

### Logs e debug

Para inspecionar requisições/respostas, rode manualmente no terminal:

```bash
LICINEXUS_LOG_LEVEL=debug npx -y @licinexusbr/mcp
```

E em outra janela, observe os logs enquanto o cliente faz chamadas.

## Ferramentas (16)

### Compras / Licitações

| Ferramenta                  | O que faz                                                                   |
| --------------------------- | --------------------------------------------------------------------------- |
| `search_licitacoes`         | Busca editais por data, modalidade, UF, CNPJ do órgão, valor, palavra-chave |
| `get_licitacao`             | Detalhes completos de um edital pelo número de controle PNCP                |
| `list_licitacao_itens`      | Itens (lotes) de um edital: descrições, quantidades, valores                |
| `list_licitacao_resultados` | Resultados da disputa por item: vencedores, preços, fornecedores            |
| `list_licitacao_arquivos`   | Documentos do edital (PDFs, anexos, termos de referência)                   |

### Contratos

| Ferramenta                   | O que faz                                                 |
| ---------------------------- | --------------------------------------------------------- |
| `search_contratos`           | Busca contratos por data, órgão, fornecedor, valor        |
| `get_contrato`               | Detalhes completos de um contrato                         |
| `list_contrato_termos`       | Termos aditivos (prorrogações, alterações de valor/prazo) |
| `list_contrato_instrumentos` | Instrumentos de cobrança (NFes, faturas)                  |

### Atas de Registro de Preço

| Ferramenta       | O que faz                                                                      |
| ---------------- | ------------------------------------------------------------------------------ |
| `search_atas_rp` | Busca atas de RP — apenas vigentes por padrão. Encontra contratos utilizáveis. |
| `get_ata_rp`     | Detalhes completos da ata + itens (com saldo disponível) + arquivos            |

### Órgãos / Fornecedores / PCA

| Ferramenta                 | O que faz                                                          |
| -------------------------- | ------------------------------------------------------------------ |
| `get_orgao`                | Perfil de órgão público (poder, esfera, natureza jurídica)         |
| `get_fornecedor_contratos` | Contratos públicos de um CNPJ como fornecedor                      |
| `search_pca`               | Plano de Contratação Anual — sinal antecipado do que será comprado |
| `list_pca_itens`           | Itens planejados de um PCA específico                              |

### Enriquecimento de CNPJ

| Ferramenta      | O que faz                                                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get_cnpj_data` | Cadastro da Receita Federal (CNAEs, sócios, capital, situação) via [BrasilAPI](https://brasilapi.com.br) (padrão) ou MinhaReceita (`CNPJ_PROVIDER=minhareceita`) |

## Prompts prontos (4)

Fluxos pré-construídos que seu assistente pode invocar diretamente:

| Prompt                   | O que faz                                                          |
| ------------------------ | ------------------------------------------------------------------ |
| `analyze_edital`         | Lista de verificação de viabilidade de um edital                   |
| `analyze_orgao`          | Perfil 360° de um órgão público                                    |
| `find_arp_opportunities` | Encontra atas vigentes com saldo disponível para uma palavra-chave |
| `check_supplier`         | Verificação básica de dado público sobre um CNPJ fornecedor        |

## Recursos (2)

| URI                       | Conteúdo                                              |
| ------------------------- | ----------------------------------------------------- |
| `licitacao://modalidades` | Tabela de referência de modalidades PNCP (Lei 14.133) |
| `licinexus://scope`       | O que este MCP faz e o que não faz                    |

## Exemplo de sessão

```
Você:   Tem alguma ata de registro de preço vigente para notebooks?
Claude: [chama search_atas_rp com palavraChave="notebook", somenteVigentes=true]
        Encontrei 12 atas vigentes mencionando notebooks. As 3 mais relevantes:
        1. Ministério da Justiça — vigência até 2026-12-31, valor estimado R$ 2,4M
        2. Prefeitura de São Paulo — vigência até 2026-09-30...

Você:   Detalhes da primeira, com saldos por item?
Claude: [chama get_ata_rp includeItens=true]
        - Item 1: Notebook tipo I (16GB RAM, 512GB SSD) — saldo 1.200 unid, R$ 4.800/un
        - Item 2: Notebook tipo II ...
```

## Roteiro de evolução

- [x] Fase 0 — Estrutura, governança, CI
- [x] Fase 1 — Licitações (5 ferramentas)
- [x] Fase 2 — Contratos + Aditivos + NFes (4 ferramentas)
- [x] Fase 3 — Atas RP (2 ferramentas)
- [x] Fase 4 — Órgãos + Fornecedores + PCA (4 ferramentas)
- [x] Fase 5 — CNPJ + 4 prompts + 2 recursos (1 ferramenta)
- [x] Teste de fumaça contra APIs reais (15/15 endpoints)
- [x] **Fase 6 — Lançamento público** (11/05/2026 · v0.1.0 no [npm](https://www.npmjs.com/package/@licinexusbr/mcp))
- [ ] Fase 7 — Adapters comunitários (TCE/TCM estaduais, ComprasNet legado)

## Escopo

### O que este MCP faz

- Encapsula APIs **públicas** do governo brasileiro (PNCP, BrasilAPI).
- Devolve dado bruto estruturado — o LLM faz a análise.
- Mantém cache local de respostas pesadas (LRU em memória, TTL curto).

### O que este MCP **não** faz

- **Não** consulta nenhuma infraestrutura nem banco de dados privado da Licinexus.
- **Não** inclui o motor de correspondência (matchmaking), pontuação de fornecedores, agregação de preços, artefatos gerados por IA ou qualquer dado proprietário da Licinexus.
- **Não** substitui o produto [Licinexus](https://licinexus.com.br) — é uma ferramenta open source complementar para a camada pública dos mesmos dados.

Veja [docs/architecture.md](docs/architecture.md) para o modelo completo de separação em três paredes.

## Precisa de matchmaking automático, alertas ou gestão de propostas?

O produto Licinexus é construído sobre essas mesmas fontes públicas, com motor de correspondência proprietário, pontuação inteligente e artefatos gerados por IA. **Este MCP intencionalmente não replica esses recursos.**

→ <https://licinexus.com.br>

## Como contribuir

PRs são bem-vindos sob o [DCO](https://developercertificate.org/) (Developer Certificate of Origin) — assine seus commits com `git commit --signoff`.

Por favor, **abra uma issue antes** para discutir qualquer mudança não trivial. Veja [CONTRIBUTING.md](CONTRIBUTING.md).

## Suporte

Projeto comunitário. **Melhor esforço, sem SLA.** Issues são triadas em até 7 dias quando possível.

Para suporte pago e funcionalidades do produto, veja [licinexus.com.br](https://licinexus.com.br).

## Segurança

Encontrou uma vulnerabilidade? Veja [SECURITY.md](SECURITY.md) para divulgação responsável (não abra issues públicas).

## Licença

MIT © Licinexus. Veja [LICENSE](LICENSE).

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

- *"Quais editais de TI no Sudeste publicados nos últimos 7 dias com valor acima de R$ 500 mil?"*
- *"Existe ata de registro de preço vigente com saldo para `notebook` no estado de SP?"*
- *"Qual o histórico de contratos do CNPJ X com órgãos públicos federais nos últimos 2 anos?"*
- *"O que a Prefeitura de Y planeja comprar este ano segundo o PCA?"*
- *"Resuma este edital e me dê uma lista de verificação de viabilidade."*

## Instalação

```bash
npx @licinexusbr/mcp
```

Pronto — sem compilação, sem banco de dados, sem token de autenticação. O servidor consulta APIs públicas diretamente.

### Configuração

**Claude Desktop** — adicione em `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

**Cursor / Continue / outros clientes MCP** — mesma estrutura, consulte a documentação do seu cliente para a localização do arquivo de configuração.

Reinicie o cliente MCP. As 16 ferramentas e 4 prompts ficarão disponíveis.

## Ferramentas (16)

### Compras / Licitações
| Ferramenta | O que faz |
| --- | --- |
| `search_licitacoes` | Busca editais por data, modalidade, UF, CNPJ do órgão, valor, palavra-chave |
| `get_licitacao` | Detalhes completos de um edital pelo número de controle PNCP |
| `list_licitacao_itens` | Itens (lotes) de um edital: descrições, quantidades, valores |
| `list_licitacao_resultados` | Resultados da disputa por item: vencedores, preços, fornecedores |
| `list_licitacao_arquivos` | Documentos do edital (PDFs, anexos, termos de referência) |

### Contratos
| Ferramenta | O que faz |
| --- | --- |
| `search_contratos` | Busca contratos por data, órgão, fornecedor, valor |
| `get_contrato` | Detalhes completos de um contrato |
| `list_contrato_termos` | Termos aditivos (prorrogações, alterações de valor/prazo) |
| `list_contrato_instrumentos` | Instrumentos de cobrança (NFes, faturas) |

### Atas de Registro de Preço
| Ferramenta | O que faz |
| --- | --- |
| `search_atas_rp` | Busca atas de RP — apenas vigentes por padrão. Encontra contratos utilizáveis. |
| `get_ata_rp` | Detalhes completos da ata + itens (com saldo disponível) + arquivos |

### Órgãos / Fornecedores / PCA
| Ferramenta | O que faz |
| --- | --- |
| `get_orgao` | Perfil de órgão público (poder, esfera, natureza jurídica) |
| `get_fornecedor_contratos` | Contratos públicos de um CNPJ como fornecedor |
| `search_pca` | Plano de Contratação Anual — sinal antecipado do que será comprado |
| `list_pca_itens` | Itens planejados de um PCA específico |

### Enriquecimento de CNPJ
| Ferramenta | O que faz |
| --- | --- |
| `get_cnpj_data` | Cadastro da Receita Federal (CNAEs, sócios, capital, situação) via [BrasilAPI](https://brasilapi.com.br) (padrão) ou MinhaReceita (`CNPJ_PROVIDER=minhareceita`) |

## Prompts prontos (4)

Fluxos pré-construídos que seu assistente pode invocar diretamente:

| Prompt | O que faz |
| --- | --- |
| `analyze_edital` | Lista de verificação de viabilidade de um edital |
| `analyze_orgao` | Perfil 360° de um órgão público |
| `find_arp_opportunities` | Encontra atas vigentes com saldo disponível para uma palavra-chave |
| `check_supplier` | Verificação básica de dado público sobre um CNPJ fornecedor |

## Recursos (2)

| URI | Conteúdo |
| --- | --- |
| `licitacao://modalidades` | Tabela de referência de modalidades PNCP (Lei 14.133) |
| `licinexus://scope` | O que este MCP faz e o que não faz |

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
- [ ] Fase 6 — Lançamento público (Show HN, Discord, awesome-lists)

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

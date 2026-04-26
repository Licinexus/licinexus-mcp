<p align="right">
  🇧🇷 Português  ·  🇺🇸 <a href="architecture.en.md">English version</a>
</p>

# Arquitetura

## O modelo de proteção

Este servidor MCP é open source, mas o produto [Licinexus](https://licinexus.com.br) como um todo não é. Os dois são deliberada e fisicamente isolados por três paredes:

```
┌─────────────────────────────────┐
│  @licinexusbr/mcp (este repo)   │──► PNCP, BrasilAPI (HTTPS, público)
│  • Licença MIT                  │
│  • Público, qualquer um forka   │
└─────────────────────────────────┘
            (mesmas APIs upstream)
┌─────────────────────────────────┐
│  Licinexus interno              │──► mesmas APIs públicas
│  • licita-core (coletor)        │    + cache + cron
│  • licita-api (produto)         │    + enriquecimento
│  • licita-match (correspondência) +  processamento por IA
│  • Privado, nunca exposto       │
└─────────────────────────────────┘
```

### Parede 1 — Arquitetural

Este MCP **nunca** consulta nenhuma API ou banco interno da Licinexus. Vai diretamente nas fontes públicas upstream (PNCP, BrasilAPI). O stack interno da Licinexus é invisível para ele.

Se algum PR futuro propuser "vamos chamar o cache da Licinexus para ganhar velocidade" — **rejeite**. Isso colapsa todo o modelo de proteção.

### Parede 2 — Escopo

O MCP intencionalmente para em "dado público bruto e estruturado". Não inclui:

- O motor de correspondência da Licinexus
- Pontuação ou analytics de fornecedores (`fornecedor_analytics`, `fornecedor_comportamento`)
- A base unificada de preços (`banco_precos_unificado`)
- Artefatos gerados por IA (atas, declarações, propostas auto-geradas)
- Qualquer dado de cliente
- Qualquer credencial de portal ou fonte privada

O usuário recebe uma lista de editais; não recebe "qual dos 3 entrar amanhã com proposta sugerida". Essa distância é onde o produto Licinexus vive.

### Parede 3 — Marca e licenciamento

- Licença: **MIT** — qualquer um pode usar, forkar, sublicenciar.
- Escopo do pacote: `@licinexusbr/*` no npm — o escopo pertence à Licinexus e não pode ser sequestrado.
- Toda resposta do servidor carrega `serverInfo.name = "licinexus-mcp"` e atribui o projeto à Licinexus.

Isso significa que o MCP pode ser remixado livremente (bom para adoção), mas a associação à marca é permanente (bom para autoridade e funil).

## Fontes de dados

Atualmente planejadas:

| Fonte | URL | Tipo | Auth |
| --- | --- | --- | --- |
| **PNCP** (Portal Nacional de Contratações Públicas) | `https://pncp.gov.br/api/consulta/v1`, `https://pncp.gov.br/api/pncp/v1` | REST (público) | nenhuma |
| **BrasilAPI** (enriquecimento de CNPJ) | `https://brasilapi.com.br/api/cnpj/v1` | REST (público) | nenhuma |

Veja [`data-sources.md`](data-sources.md) para o mapeamento endpoint a endpoint.

## Cache

Cache local por usuário via SQLite (caminho padrão: `~/.cache/licinexus-mcp/`). TTL curto (5–60 min dependendo do endpoint). Sem cache compartilhado entre usuários.

O cache é puramente uma cortesia para as APIs upstream e para deixar os tempos de resposta ágeis. Usuários podem desabilitar via variável de ambiente.

## Padrão de adaptadores

Cada API upstream tem seu próprio adaptador em `src/adapters/`. Adaptadores são wrappers finos que:

1. Compõem a URL upstream com parâmetros validados.
2. Chamam a API com timeout e retry sensatos.
3. Validam a forma da resposta com Zod.
4. Normalizam para um tipo interno consistente.

O adaptador de CNPJ é **trocável** via variável de ambiente (`CNPJ_PROVIDER=brasilapi|minhareceita|...`). Isso significa que podemos trocar de provedor (ou um dia apontar para um endpoint público da Licinexus) sem tocar no código das ferramentas.

## Tools / Resources / Prompts

- **Tools** em `src/tools/` — ações que o LLM pode invocar.
- **Resources** em `src/schemas/` para dados estáticos de referência (taxonomia CNAE, tabelas de modalidade).
- **Prompts** em `src/prompts/` — modelos pré-definidos (analisar edital, resumir, etc.).

Cada entrada de tool é um schema Zod; cada saída é JSON normalizado. Erros são retornados como erros estruturados, nunca como resultados vazios silenciosos.

## O que NÃO está aqui, por design

- Sem banco de dados (exceto o cache local).
- Sem jobs em background / cron / filas.
- Sem autenticação (todas as APIs upstream são anônimas).
- Sem telemetria reportando para a Licinexus.
- Sem imports de pacotes privados `licita-*` — garantido por ESLint e CI.

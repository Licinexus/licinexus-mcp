<p align="right">
  🇧🇷 Português  ·  🇺🇸 <a href="data-sources.en.md">English version</a>
</p>

# Fontes de dados

Todos os dados expostos por este MCP vêm de **APIs públicas e anônimas do governo brasileiro e de agregadores públicos conhecidos**. Este documento mapeia cada fonte.

## PNCP — Portal Nacional de Contratações Públicas

**URLs base:**
- `https://pncp.gov.br/api/consulta/v1` — busca / listagem
- `https://pncp.gov.br/api/pncp/v1` — endpoints de detalhe

**Licença/Termos:** Dado público pela Lei 14.133/2021 e pela Lei de Acesso à Informação (12.527/2011).

### Domínios que planejamos expor

| Domínio | Endpoints | Status |
| --- | --- | --- |
| **Compras / Editais** | `/contratacoes/publicacao`, `/contratacoes/proposta`, `/orgaos/{cnpj}/compras/{ano}/{seq}` | Implementado (Fase 1) |
| **Itens & Resultados** | `/orgaos/{cnpj}/compras/{ano}/{seq}/itens`, `.../resultados` | Implementado (Fase 1) |
| **Arquivos** | `/orgaos/{cnpj}/compras/{ano}/{seq}/arquivos` | Implementado (Fase 2) |
| **Contratos** | `/contratos`, `/contratos/atualizacao` | Implementado (Fase 2) |
| **Termos Aditivos** | `/orgaos/{cnpj}/contratos/{ano}/{seq}/termos` | Implementado (Fase 2) |
| **Instrumentos de Cobrança (NFes)** | `/orgaos/{cnpj}/contratos/{ano}/{seq}/instrumentocobranca` | Implementado (Fase 2) |
| **Atas RP** | `/atas`, `/orgaos/{cnpj}/compras/{ano}/{seq}/atas/{seq_ata}` | Implementado (Fase 3) |
| **Órgãos** | `/orgaos/{cnpj}` | Implementado (Fase 4) |
| **PCA (Plano de Contratação Anual)** | `/pca/atualizacao`, `/orgaos/{cnpj}/pca/{ano}/{seq}/itens` | Implementado (Fase 4) |

## CNPJ da Receita Federal (via agregador)

**Não** distribuímos o dump mensal da Receita Federal (~15 GB) — isso é apropriado para coletor server-side, mas não para uma instalação MCP local. Em vez disso, encapsulamos uma API agregadora pública:

**Provedor padrão:** [BrasilAPI](https://brasilapi.com.br) — `https://brasilapi.com.br/api/cnpj/v1/{cnpj}`

**Licença/Termos:** Dado público da Receita Federal (Dados Abertos). BrasilAPI é mantida pela comunidade e gratuita.

**Trocável:** usuários podem sobrescrever via variável `CNPJ_PROVIDER`. Versões futuras podem suportar `minhareceita`, `cnpja`, ou um endpoint hospedado pela Licinexus.

## O que NÃO usamos

- **Sem APIs com paywall**
- **Sem dado raspado atrás de auth ou CAPTCHA**
- **Sem banco ou API privada da Licinexus** — veja [architecture.md](architecture.md)
- **Sem dado de cliente**

## Atualizando esta lista

Novas fontes de dados exigem uma issue com a label `data-source`, revisão de escopo e aprovação de um mantenedor. O critério:

1. A fonte é genuinamente pública.
2. A fonte tem termos de uso estáveis (ou é dado aberto mandatado por lei).
3. Adicionar a fonte não embaralha a fronteira com o produto pago Licinexus.

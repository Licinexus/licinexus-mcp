<p align="right">
  🇧🇷 Português  ·  🇺🇸 <a href="CONTRIBUTING.en.md">English version</a>
</p>

# Como contribuir com `@licinexusbr/mcp`

Obrigado por considerar uma contribuição! Algumas regras para manter o projeto saudável.

## Abra uma issue antes

Para qualquer mudança não trivial (nova ferramenta, novo adaptador, nova dependência, refatoração), **por favor abra uma issue antes** para discutir a abordagem. PRs sem discussão prévia podem ser fechados.

Correções de bugs claros (com passos para reproduzir) podem ir direto para PR.

## Developer Certificate of Origin (DCO)

Usamos [DCO](https://developercertificate.org/) em vez de CLA. Todo commit deve incluir uma linha `Signed-off-by`:

```bash
git commit --signoff -m "sua mensagem"
# ou: git commit -s -m "sua mensagem"
```

A linha `Signed-off-by` certifica que você escreveu o código, ou possui o direito de contribuir com ele sob a licença do projeto. O texto completo está em <https://developercertificate.org/>.

Uma checagem de CI valida isso em todo PR.

## O que aceitamos

✅ **Sim, por favor:**
- Correções de bugs
- Novos adaptadores para APIs públicas brasileiras de governo (TCEs estaduais, MPs, etc.)
- Melhorias nas ferramentas existentes (filtros melhores, paginação, mensagens de erro)
- Documentação, exemplos, testes
- Melhorias de desempenho / cache

❌ **Não, obrigado:**
- Código que importe de pacotes privados da Licinexus (o CI já bloqueia isso)
- Funcionalidades que dupliquem o produto pago Licinexus (motor de correspondência, pontuação de fornecedores, agregação de preços, artefatos gerados por IA) — este MCP intencionalmente para em "dado público bruto"
- Adaptadores para fontes não públicas ou com paywall
- Dependências pesadas sem justificativa forte

## Configuração de desenvolvimento

```bash
git clone https://github.com/Licinexus/licinexus-mcp.git
cd licinexus-mcp
npm install
npm run dev      # roda com tsx
npm test         # roda vitest
npm run lint     # roda eslint
npm run typecheck
```

## Arquitetura

Antes de contribuir, leia [docs/architecture.md](docs/architecture.md). O modelo de proteção é inegociável — PRs que enfraqueçam a fronteira entre este MCP e o código privado da Licinexus serão rejeitados.

## Estilo de código

- TypeScript em modo estrito.
- Prettier para formatação (`npm run format`).
- ESLint precisa passar (`npm run lint`).
- Use `zod` para validação de schemas nas fronteiras.
- Prefira exportações nomeadas.

## Mensagens de commit

O estilo Conventional Commits é apreciado mas não obrigatório:

```
feat(pncp): adiciona ferramenta search_atas_rp
fix(cnpj): trata CNPJ de 14 dígitos com zeros à esquerda
docs: clarifica escopo no README
```

## Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a licença MIT.

## Código de conduta

Ao participar, você concorda em respeitar o [Código de Conduta](CODE_OF_CONDUCT.md).

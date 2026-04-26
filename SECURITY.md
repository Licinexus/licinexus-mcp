<p align="right">
  🇧🇷 Português  ·  🇺🇸 <a href="SECURITY.en.md">English version</a>
</p>

# Política de Segurança

## Reportando uma vulnerabilidade

Se você descobriu uma vulnerabilidade em `@licinexusbr/mcp`, **por favor não abra uma issue pública**.

Em vez disso, envie email para **licitacao@licinexus.com.br** com:

- Descrição clara da vulnerabilidade
- Passos para reproduzir
- Versões afetadas
- Sua avaliação de impacto

Nosso compromisso:

- Confirmar o recebimento em até **3 dias úteis**
- Fornecer avaliação inicial em até **7 dias úteis**
- Coordenar a correção e o cronograma de divulgação (tipicamente em até 90 dias)

Seguimos práticas de [divulgação responsável](https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure) e creditamos publicamente os reportadores (com permissão) quando a correção é liberada.

## Escopo

Dentro do escopo:

- Vulnerabilidades no código-fonte de `@licinexusbr/mcp` publicado neste repositório.
- Problemas que possam levar a RCE, exfiltração de dados ou negação de serviço em ambientes de usuário rodando o MCP localmente.

Fora do escopo:

- Vulnerabilidades em APIs upstream (PNCP, BrasilAPI, etc.) — por favor reporte aos respectivos mantenedores.
- Vulnerabilidades em dependências — por favor reporte aos projetos correspondentes (atualizamos via Dependabot).
- O produto pago Licinexus (`licinexus.com.br`) — por favor entre em contato pelo suporte de lá.

## Versões com suporte

| Versão | Suporte |
| ------- | ------------------ |
| 0.x     | :white_check_mark: (pré-release; apenas a versão minor mais recente) |

## Boas práticas de segurança para usuários

- Sempre instale a partir do npm (`@licinexusbr/mcp`) ou do release oficial no GitHub — nunca de forks que você não conheça.
- Mantenha sua instalação atualizada (`npm update @licinexusbr/mcp`).
- Este MCP faz requisições HTTPS de saída para APIs públicas do governo brasileiro. Não transmite dado nenhum para servidores da Licinexus.

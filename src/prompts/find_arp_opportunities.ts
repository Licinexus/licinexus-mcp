import type { PromptDef } from './types.js';
import { userMessage } from './types.js';

export const findArpOpportunities: PromptDef = {
  definition: {
    name: 'find_arp_opportunities',
    description:
      'Find active Atas de Registro de Preço (ARPs) matching a keyword that may still have available balance — a key supplier opportunity since any compatible agency can use the ARP without a new bid.',
    arguments: [
      {
        name: 'palavraChave',
        description: 'Keyword (e.g. "notebook", "uniformes", "limpeza").',
        required: true,
      },
      { name: 'uf', description: 'Optional 2-letter state filter.', required: false },
      {
        name: 'diasAtras',
        description: 'How many days back to scan (default 180).',
        required: false,
      },
    ],
  },

  async handler(args) {
    const kw = args?.palavraChave ?? '';
    const uf = args?.uf ? ` na UF ${args.uf}` : '';
    return userMessage(
      [
        `Procure oportunidades de carona em Atas de Registro de Preço sobre "${kw}"${uf}.`,
        '',
        'Etapas:',
        '',
        '1. Use **search_atas_rp** com palavraChave="' + kw + '" e somenteVigentes=true.',
        '',
        '2. Para cada ata promissora (top 5), use **get_ata_rp** com includeItens=true',
        '   e identifique itens com saldoQuantidade > 0.',
        '',
        '3. Para cada oportunidade real:',
        '   - Quantidade de saldo, valor unitário, fornecedor vencedor',
        '   - Vigência restante (até quando dá pra aderir)',
        '   - Órgão gerenciador (quem autoriza adesões)',
        '',
        '4. Ranking final: ordene por (saldo × valor unitário × dias de vigência restante).',
        '',
        '5. Aviso final ao usuário: lembrar que adesão a ARP exige autorização do órgão',
        '   gerenciador e pode ter limites de quantidade por carona.',
      ].join('\n'),
    );
  },
};

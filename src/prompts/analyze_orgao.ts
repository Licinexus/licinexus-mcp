import type { PromptDef } from './types.js';
import { userMessage } from './types.js';

export const analyzeOrgao: PromptDef = {
  definition: {
    name: 'analyze_orgao',
    description:
      'Profile a public agency: who they are, what they buy, who they buy from. Combines get_orgao + search_contratos + search_pca for a 360° view.',
    arguments: [
      { name: 'cnpj', description: 'Agency CNPJ (14 digits).', required: true },
      {
        name: 'foco',
        description: 'Optional area of interest (e.g. "TI", "saúde", "obras").',
        required: false,
      },
    ],
  },

  async handler(args) {
    const cnpj = args?.cnpj ?? '';
    const foco = args?.foco ? `, com foco em "${args.foco}"` : '';
    return userMessage(
      [
        `Construa um perfil 360° do órgão público CNPJ ${cnpj}${foco}.`,
        '',
        'Etapas:',
        '',
        '1. Use **get_orgao** com cnpj="' + cnpj + '" — descreva poder, esfera, natureza jurídica.',
        '',
        '2. Use **search_contratos** com cnpjOrgao="' + cnpj + '" e os últimos 365 dias —',
        '   agrupe por fornecedor (top 5 por valor agregado), por tipo (objeto similar),',
        '   e por valor médio.',
        '',
        '3. Use **search_pca** com cnpjOrgao="' + cnpj + '" — o que o órgão planeja',
        '   comprar este ano? Há janelas de oportunidade?',
        '',
        '4. Conclusão estratégica: para um fornecedor que quer atender este órgão,',
        '   qual o caminho de entrada mais provável (modalidade, porte, CNAE)?',
        '   Quem são os concorrentes incumbentes?',
      ].join('\n'),
    );
  },
};

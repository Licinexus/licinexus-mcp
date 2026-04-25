import type { PromptDef } from './types.js';
import { userMessage } from './types.js';

export const analyzeEdital: PromptDef = {
  definition: {
    name: 'analyze_edital',
    description:
      'Produce a viability checklist for a public bid: object, value, deadlines, required certifications, risks. Uses get_licitacao + list_licitacao_itens + list_licitacao_arquivos.',
    arguments: [
      {
        name: 'numeroControlePNCP',
        description: 'PNCP control number (e.g. 12345678000123-1-000001/2024).',
        required: true,
      },
    ],
  },

  async handler(args) {
    const numero = args?.numeroControlePNCP ?? '';
    return userMessage(
      [
        `Analise a licitação ${numero} usando as tools disponíveis. Produza:`,
        '',
        '1. **Resumo executivo** (3-5 linhas)',
        '   - Objeto, modalidade, órgão, UF',
        '   - Valor estimado vs homologado',
        '   - Datas-chave: publicação, abertura, encerramento',
        '',
        '2. **Itens críticos**',
        '   - Use list_licitacao_itens',
        '   - Identifique itens de maior valor unitário',
        '   - Sinalize critério de julgamento',
        '',
        '3. **Documentos essenciais**',
        '   - Use list_licitacao_arquivos',
        '   - Liste cada arquivo com URL e o que provavelmente contém',
        '',
        '4. **Checklist de viabilidade** (sim/não/depende)',
        '   - Empresa atende ao CNAE exigido?',
        '   - Prazo é realista?',
        '   - Valor compatível com porte declarado?',
        '   - Há indicação de exigências especiais (atestados, certificações)?',
        '',
        '5. **Riscos e bandeiras vermelhas**',
        '   - Indícios de direcionamento, especificações fechadas, prazos curtos',
        '',
        'Comece chamando get_licitacao com numeroControlePNCP="' + numero + '".',
      ].join('\n'),
    );
  },
};

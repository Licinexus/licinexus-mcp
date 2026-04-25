import type { PromptDef } from './types.js';
import { userMessage } from './types.js';

export const checkSupplier: PromptDef = {
  definition: {
    name: 'check_supplier',
    description:
      'Check basic public information about a supplier CNPJ: company data (CNAEs, partners, capital), public contract history, and operational signals. Cross-references get_cnpj_data + get_fornecedor_contratos.',
    arguments: [
      {
        name: 'cnpj',
        description: 'Supplier CNPJ to investigate.',
        required: true,
      },
    ],
  },

  async handler(args) {
    const cnpj = args?.cnpj ?? '';
    return userMessage(
      [
        `Faça uma checagem básica do fornecedor CNPJ ${cnpj}.`,
        '',
        'Etapas:',
        '',
        '1. **Cadastro** — use get_cnpj_data com cnpj="' + cnpj + '"',
        '   - Razão social, nome fantasia, situação cadastral',
        '   - CNAE principal e secundários',
        '   - Sócios (QSA), capital social, porte',
        '   - Endereço',
        '',
        '2. **Histórico em contratos públicos** — use get_fornecedor_contratos',
        '   com cnpj="' + cnpj + '" e diasAtras=730 (2 anos)',
        '   - Quantos contratos? Valor total agregado?',
        '   - Que tipo de objeto contrata?',
        '   - Concentração em poucos órgãos ou diversificado?',
        '   - Alguma UF dominante?',
        '',
        '3. **Sinais operacionais**',
        '   - Empresa ativa há quanto tempo? (data_inicio_atividade)',
        '   - Capital social compatível com volume de contratos?',
        '   - Mudanças recentes de situação cadastral?',
        '',
        '4. **Resumo final**: resumo executivo em 4-5 linhas. Sem opinar sobre',
        '   "confiabilidade" — apenas fatos do dado público.',
        '',
        'Importante: este MCP **não consulta sanções** (CEIS/CEPIM/CNEP). Lembre o',
        'usuário de checar essas listas separadamente antes de decisões comerciais.',
      ].join('\n'),
    );
  },
};

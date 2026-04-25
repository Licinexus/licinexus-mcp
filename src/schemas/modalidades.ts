export interface Modalidade {
  id: number;
  nome: string;
}

export const MODALIDADES_PNCP: Modalidade[] = [
  { id: 1, nome: 'Leilão - Eletrônico' },
  { id: 2, nome: 'Diálogo Competitivo' },
  { id: 3, nome: 'Concurso' },
  { id: 4, nome: 'Concorrência - Eletrônica' },
  { id: 5, nome: 'Concorrência - Presencial' },
  { id: 6, nome: 'Pregão - Eletrônico' },
  { id: 7, nome: 'Pregão - Presencial' },
  { id: 8, nome: 'Dispensa de Licitação' },
  { id: 9, nome: 'Inexigibilidade' },
  { id: 10, nome: 'Manifestação de Interesse' },
  { id: 11, nome: 'Pré-qualificação' },
  { id: 12, nome: 'Credenciamento' },
  { id: 13, nome: 'Leilão - Presencial' },
];

export const MODALIDADE_IDS = MODALIDADES_PNCP.map((m) => m.id);
export const DEFAULT_MODALIDADES = [6, 8, 9];

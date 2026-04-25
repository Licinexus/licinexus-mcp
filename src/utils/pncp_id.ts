import { z } from 'zod';

const CNPJ_RE = /^\d{14}$/;

export interface PncpId {
  orgaoCnpj: string;
  ano: number;
  sequencial: number;
}

const NUMERO_CONTROLE_RE = /^(\d{14})-(\d+)-(\d+)\/(\d{4})$/;

export function parseNumeroControle(input: string): PncpId {
  const match = input.match(NUMERO_CONTROLE_RE);
  if (!match) {
    throw new Error(
      `Invalid numero_controle_pncp format: "${input}". Expected: NNNNNNNNNNNNNN-D-NNNNNN/YYYY`,
    );
  }
  const [, cnpj, , seq, ano] = match;
  return {
    orgaoCnpj: cnpj!,
    ano: Number.parseInt(ano!, 10),
    sequencial: Number.parseInt(seq!, 10),
  };
}

export function normalizeCnpj(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (!CNPJ_RE.test(digits)) {
    throw new Error(`Invalid CNPJ: "${input}" (expected 14 digits)`);
  }
  return digits;
}

export const PncpIdInputSchema = z
  .object({
    numeroControlePNCP: z.string().optional(),
    orgaoCnpj: z.string().optional(),
    ano: z.number().int().optional(),
    sequencial: z.number().int().optional(),
  })
  .refine(
    (v) =>
      Boolean(v.numeroControlePNCP) ||
      (Boolean(v.orgaoCnpj) && Boolean(v.ano) && Boolean(v.sequencial)),
    {
      message: 'Provide either numeroControlePNCP, or all three of orgaoCnpj/ano/sequencial.',
    },
  );

export function resolvePncpId(input: z.infer<typeof PncpIdInputSchema>): PncpId {
  if (input.numeroControlePNCP) {
    return parseNumeroControle(input.numeroControlePNCP);
  }
  return {
    orgaoCnpj: normalizeCnpj(input.orgaoCnpj!),
    ano: input.ano!,
    sequencial: input.sequencial!,
  };
}

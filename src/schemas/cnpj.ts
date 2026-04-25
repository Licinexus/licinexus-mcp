import { z } from 'zod';

const cnaeSecundarioSchema = z
  .object({
    codigo: z.union([z.number(), z.string()]).nullable().optional(),
    descricao: z.string().nullable().optional(),
  })
  .passthrough();

const socioSchema = z
  .object({
    nome_socio: z.string().nullable().optional(),
    codigo_qualificacao_socio: z.number().nullable().optional(),
    qualificacao_socio: z.string().nullable().optional(),
    data_entrada_sociedade: z.string().nullable().optional(),
    cnpj_cpf_do_socio: z.string().nullable().optional(),
    identificador_de_socio: z.number().nullable().optional(),
  })
  .passthrough();

const naturezaJuridicaSchema = z.union([
  z.string(),
  z
    .object({
      codigo: z.union([z.number(), z.string()]).nullable().optional(),
      descricao: z.string().nullable().optional(),
    })
    .passthrough(),
]);

const porteSchema = z.union([
  z.string(),
  z
    .object({
      id: z.union([z.number(), z.string()]).nullable().optional(),
      descricao: z.string().nullable().optional(),
    })
    .passthrough(),
]);

export const CnpjDataSchema = z
  .object({
    cnpj: z.string(),
    identificador_matriz_filial: z.number().nullable().optional(),
    descricao_matriz_filial: z.string().nullable().optional(),
    razao_social: z.string().nullable().optional(),
    nome_fantasia: z.string().nullable().optional(),
    situacao_cadastral: z.union([z.number(), z.string()]).nullable().optional(),
    descricao_situacao_cadastral: z.string().nullable().optional(),
    data_situacao_cadastral: z.string().nullable().optional(),
    motivo_situacao_cadastral: z.union([z.number(), z.string()]).nullable().optional(),
    nome_cidade_no_exterior: z.string().nullable().optional(),
    codigo_pais: z.union([z.number(), z.string()]).nullable().optional(),
    pais: z.string().nullable().optional(),
    data_inicio_atividade: z.string().nullable().optional(),
    cnae_fiscal: z.union([z.number(), z.string()]).nullable().optional(),
    cnae_fiscal_descricao: z.string().nullable().optional(),
    descricao_tipo_de_logradouro: z.string().nullable().optional(),
    logradouro: z.string().nullable().optional(),
    numero: z.string().nullable().optional(),
    complemento: z.string().nullable().optional(),
    bairro: z.string().nullable().optional(),
    cep: z.string().nullable().optional(),
    uf: z.string().nullable().optional(),
    codigo_municipio: z.union([z.number(), z.string()]).nullable().optional(),
    municipio: z.string().nullable().optional(),
    ddd_telefone_1: z.string().nullable().optional(),
    ddd_telefone_2: z.string().nullable().optional(),
    ddd_fax: z.string().nullable().optional(),
    qualificacao_do_responsavel: z.union([z.number(), z.string()]).nullable().optional(),
    capital_social: z.number().nullable().optional(),
    porte: porteSchema.nullable().optional(),
    natureza_juridica: naturezaJuridicaSchema.nullable().optional(),
    opcao_pelo_simples: z.boolean().nullable().optional(),
    data_opcao_pelo_simples: z.string().nullable().optional(),
    data_exclusao_do_simples: z.string().nullable().optional(),
    opcao_pelo_mei: z.boolean().nullable().optional(),
    cnaes_secundarios: z.array(cnaeSecundarioSchema).nullable().optional(),
    qsa: z.array(socioSchema).nullable().optional(),
  })
  .passthrough();

export type CnpjData = z.infer<typeof CnpjDataSchema>;

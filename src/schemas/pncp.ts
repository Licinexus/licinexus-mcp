import { z } from 'zod';

const orgaoEntidadeSchema = z
  .object({
    cnpj: z.string().nullable().optional(),
    razaoSocial: z.string().nullable().optional(),
    poderId: z.string().nullable().optional(),
    esferaId: z.string().nullable().optional(),
  })
  .passthrough();

const unidadeOrgaoSchema = z
  .object({
    codigoUnidade: z.string().nullable().optional(),
    nomeUnidade: z.string().nullable().optional(),
    ufSigla: z.string().nullable().optional(),
    ufNome: z.string().nullable().optional(),
    municipioNome: z.string().nullable().optional(),
    codigoIbge: z.string().nullable().optional(),
  })
  .passthrough();

const amparoLegalSchema = z
  .object({
    codigo: z.number().nullable().optional(),
    nome: z.string().nullable().optional(),
    descricao: z.string().nullable().optional(),
  })
  .passthrough();

export const ContratacaoSchema = z
  .object({
    numeroControlePNCP: z.string(),
    anoCompra: z.number(),
    sequencialCompra: z.number(),
    numeroCompra: z.string().nullable().optional(),
    processo: z.string().nullable().optional(),
    orgaoEntidade: orgaoEntidadeSchema.nullable().optional(),
    unidadeOrgao: unidadeOrgaoSchema.nullable().optional(),
    modalidadeId: z.number().nullable().optional(),
    modalidadeNome: z.string().nullable().optional(),
    modoDisputaId: z.number().nullable().optional(),
    modoDisputaNome: z.string().nullable().optional(),
    srp: z.boolean().nullable().optional(),
    objetoCompra: z.string().nullable().optional(),
    informacaoComplementar: z.string().nullable().optional(),
    valorTotalEstimado: z.number().nullable().optional(),
    valorTotalHomologado: z.number().nullable().optional(),
    situacaoCompraId: z.number().nullable().optional(),
    situacaoCompraNome: z.string().nullable().optional(),
    dataPublicacaoPncp: z.string().nullable().optional(),
    dataAberturaProposta: z.string().nullable().optional(),
    dataEncerramentoProposta: z.string().nullable().optional(),
    dataInclusao: z.string().nullable().optional(),
    dataAtualizacao: z.string().nullable().optional(),
    linkSistemaOrigem: z.string().nullable().optional(),
    linkProcessoEletronico: z.string().nullable().optional(),
    amparoLegal: amparoLegalSchema.nullable().optional(),
    tipoInstrumentoConvocatorioCodigo: z.number().nullable().optional(),
    tipoInstrumentoConvocatorioNome: z.string().nullable().optional(),
  })
  .passthrough();

export type Contratacao = z.infer<typeof ContratacaoSchema>;

export const ContratacoesPageSchema = z
  .object({
    data: z.array(ContratacaoSchema).default([]),
    totalRegistros: z.number().optional(),
    totalPaginas: z.number().optional(),
    numeroPagina: z.number().optional(),
    paginasRestantes: z.number().optional(),
    empty: z.boolean().optional(),
  })
  .passthrough();

export type ContratacoesPage = z.infer<typeof ContratacoesPageSchema>;

export const ItemContratacaoSchema = z
  .object({
    numeroItem: z.number(),
    descricao: z.string().nullable().optional(),
    materialOuServico: z.string().nullable().optional(),
    materialOuServicoNome: z.string().nullable().optional(),
    valorUnitarioEstimado: z.number().nullable().optional(),
    valorTotal: z.number().nullable().optional(),
    quantidade: z.number().nullable().optional(),
    unidadeMedida: z.string().nullable().optional(),
    itemCategoriaId: z.number().nullable().optional(),
    itemCategoriaNome: z.string().nullable().optional(),
    criterioJulgamentoId: z.number().nullable().optional(),
    criterioJulgamentoNome: z.string().nullable().optional(),
    situacaoCompraItem: z.number().nullable().optional(),
    situacaoCompraItemNome: z.string().nullable().optional(),
    tipoBeneficio: z.number().nullable().optional(),
    tipoBeneficioNome: z.string().nullable().optional(),
    ncmNbsCodigo: z.string().nullable().optional(),
    ncmNbsDescricao: z.string().nullable().optional(),
    catalogo: z.string().nullable().optional(),
    categoriaItemCatalogo: z.string().nullable().optional(),
  })
  .passthrough();

export type ItemContratacao = z.infer<typeof ItemContratacaoSchema>;

export const ResultadoItemSchema = z
  .object({
    numeroItem: z.number().optional(),
    numeroResultado: z.number().optional(),
    ordemClassificacaoSrp: z.number().nullable().optional(),
    niFornecedor: z.string().nullable().optional(),
    tipoPessoa: z.string().nullable().optional(),
    nomeRazaoSocialFornecedor: z.string().nullable().optional(),
    porteFornecedorId: z.number().nullable().optional(),
    porteFornecedorNome: z.string().nullable().optional(),
    situacaoCompraItemResultadoId: z.number().nullable().optional(),
    situacaoCompraItemResultadoNome: z.string().nullable().optional(),
    valorUnitario: z.number().nullable().optional(),
    valorTotal: z.number().nullable().optional(),
    percentualDesconto: z.number().nullable().optional(),
    marca: z.string().nullable().optional(),
    modelo: z.string().nullable().optional(),
    dataResultado: z.string().nullable().optional(),
  })
  .passthrough();

export type ResultadoItem = z.infer<typeof ResultadoItemSchema>;

export const ArquivoSchema = z
  .object({
    sequencialDocumento: z.number(),
    titulo: z.string().nullable().optional(),
    tipoDocumentoNome: z.string().nullable().optional(),
    url: z.string().nullable().optional(),
    uri: z.string().nullable().optional(),
    dataPublicacaoPncp: z.string().nullable().optional(),
    cnpj: z.string().nullable().optional(),
    anoCompra: z.number().nullable().optional(),
    sequencialCompra: z.number().nullable().optional(),
  })
  .passthrough();

export type Arquivo = z.infer<typeof ArquivoSchema>;

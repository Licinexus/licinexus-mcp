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

const fornecedorSchema = z
  .object({
    cnpj: z.string().nullable().optional(),
    cpf: z.string().nullable().optional(),
    ni: z.string().nullable().optional(),
    razaoSocial: z.string().nullable().optional(),
    nome: z.string().nullable().optional(),
    tipoPessoa: z.string().nullable().optional(),
    naturezaJuridicaCodigo: z.string().nullable().optional(),
    naturezaJuridicaNome: z.string().nullable().optional(),
    porteFornecedorId: z.number().nullable().optional(),
    porteFornecedorNome: z.string().nullable().optional(),
  })
  .passthrough();

export const ContratoSchema = z
  .object({
    numeroControlePNCP: z.string(),
    numeroControlePNCPCompra: z.string().nullable().optional(),
    anoContrato: z.number(),
    sequencialContrato: z.number(),
    numeroContratoEmpenho: z.string().nullable().optional(),
    orgaoEntidade: orgaoEntidadeSchema.nullable().optional(),
    unidadeOrgao: unidadeOrgaoSchema.nullable().optional(),
    fornecedor: fornecedorSchema.nullable().optional(),
    objetoContrato: z.string().nullable().optional(),
    informacaoComplementar: z.string().nullable().optional(),
    valorInicial: z.number().nullable().optional(),
    valorGlobal: z.number().nullable().optional(),
    valorParcela: z.number().nullable().optional(),
    valorAcumulado: z.number().nullable().optional(),
    numeroParcelas: z.number().nullable().optional(),
    numeroRetificacao: z.number().nullable().optional(),
    dataAssinatura: z.string().nullable().optional(),
    dataVigenciaInicio: z.string().nullable().optional(),
    dataVigenciaFim: z.string().nullable().optional(),
    dataPublicacaoPncp: z.string().nullable().optional(),
    tipoContratoId: z.number().nullable().optional(),
    tipoContratoNome: z.string().nullable().optional(),
    categoriaProcessoId: z.number().nullable().optional(),
    categoriaProcessoNome: z.string().nullable().optional(),
    receitaDespesaCodigo: z.string().nullable().optional(),
    receitaDespesaNome: z.string().nullable().optional(),
  })
  .passthrough();

export type Contrato = z.infer<typeof ContratoSchema>;

export const ContratosPageSchema = z
  .object({
    data: z.array(ContratoSchema).default([]),
    totalRegistros: z.number().optional(),
    totalPaginas: z.number().optional(),
    numeroPagina: z.number().optional(),
    paginasRestantes: z.number().optional(),
    empty: z.boolean().optional(),
  })
  .passthrough();

export type ContratosPage = z.infer<typeof ContratosPageSchema>;

export const TermoContratoSchema = z
  .object({
    numeroControlePNCPContrato: z.string().nullable().optional(),
    sequencialTermo: z.number().nullable().optional(),
    tipoTermoContratoId: z.number().nullable().optional(),
    tipoTermoContratoNome: z.string().nullable().optional(),
    numeroTermoContrato: z.string().nullable().optional(),
    dataAssinatura: z.string().nullable().optional(),
    dataPublicacaoPncp: z.string().nullable().optional(),
    fundamentoLegal: z.string().nullable().optional(),
    informacaoComplementar: z.string().nullable().optional(),
    valorAcrescimo: z.number().nullable().optional(),
    valorReducao: z.number().nullable().optional(),
    prazoAcrescimoDias: z.number().nullable().optional(),
    prazoReducaoDias: z.number().nullable().optional(),
    novaDataVigenciaFim: z.string().nullable().optional(),
  })
  .passthrough();

export type TermoContrato = z.infer<typeof TermoContratoSchema>;

export const InstrumentoCobrancaSchema = z
  .object({
    sequencialInstrumentoCobranca: z.number().nullable().optional(),
    numeroInstrumentoCobranca: z.string().nullable().optional(),
    dataEmissao: z.string().nullable().optional(),
    observacao: z.string().nullable().optional(),
    tipoInstrumentoCobrancaId: z.number().nullable().optional(),
    tipoInstrumentoCobrancaNome: z.string().nullable().optional(),
    chaveNFe: z.string().nullable().optional(),
    fonteNFe: z.string().nullable().optional(),
  })
  .passthrough();

export type InstrumentoCobranca = z.infer<typeof InstrumentoCobrancaSchema>;

export const AtaSchema = z
  .object({
    numeroControlePNCP: z.string(),
    numeroAtaRegistroPreco: z.string().nullable().optional(),
    numeroControlePNCPCompra: z.string().nullable().optional(),
    anoAta: z.number(),
    sequencialAta: z.number(),
    objetoContratacao: z.string().nullable().optional(),
    orgaoEntidade: orgaoEntidadeSchema.nullable().optional(),
    unidadeOrgao: unidadeOrgaoSchema.nullable().optional(),
    valorTotalEstimado: z.number().nullable().optional(),
    valorTotalHomologado: z.number().nullable().optional(),
    dataAssinatura: z.string().nullable().optional(),
    dataVigenciaInicio: z.string().nullable().optional(),
    dataVigenciaFim: z.string().nullable().optional(),
    dataPublicacaoPncp: z.string().nullable().optional(),
    cancelada: z.boolean().nullable().optional(),
    situacaoAtaId: z.number().nullable().optional(),
    situacaoAtaNome: z.string().nullable().optional(),
  })
  .passthrough();

export type Ata = z.infer<typeof AtaSchema>;

export const AtasPageSchema = z
  .object({
    data: z.array(AtaSchema).default([]),
    totalRegistros: z.number().optional(),
    totalPaginas: z.number().optional(),
    numeroPagina: z.number().optional(),
    paginasRestantes: z.number().optional(),
    empty: z.boolean().optional(),
  })
  .passthrough();

export type AtasPage = z.infer<typeof AtasPageSchema>;

export const ItemAtaSchema = z
  .object({
    numeroItem: z.number(),
    descricao: z.string().nullable().optional(),
    quantidade: z.number().nullable().optional(),
    quantidadeOriginal: z.number().nullable().optional(),
    saldoQuantidade: z.number().nullable().optional(),
    unidadeMedida: z.string().nullable().optional(),
    valorUnitario: z.number().nullable().optional(),
    valorTotal: z.number().nullable().optional(),
    niFornecedor: z.string().nullable().optional(),
    nomeRazaoSocialFornecedor: z.string().nullable().optional(),
    marca: z.string().nullable().optional(),
    modelo: z.string().nullable().optional(),
  })
  .passthrough();

export type ItemAta = z.infer<typeof ItemAtaSchema>;

export const OrgaoSchema = z
  .object({
    cnpj: z.string(),
    razaoSocial: z.string().nullable().optional(),
    nomeFantasia: z.string().nullable().optional(),
    poderId: z.string().nullable().optional(),
    poder: z.string().nullable().optional(),
    esferaId: z.string().nullable().optional(),
    esfera: z.string().nullable().optional(),
    naturezaJuridicaCodigo: z.string().nullable().optional(),
    naturezaJuridicaNome: z.string().nullable().optional(),
    situacaoCadastral: z.string().nullable().optional(),
    municipioNome: z.string().nullable().optional(),
    ufSigla: z.string().nullable().optional(),
    dataInclusaoPncp: z.string().nullable().optional(),
    dataAtualizacaoPncp: z.string().nullable().optional(),
  })
  .passthrough();

export type Orgao = z.infer<typeof OrgaoSchema>;

export const PcaItemSchema = z
  .object({
    orgaoCnpj: z.string().nullable().optional(),
    anoPca: z.number().nullable().optional(),
    codigoUnidade: z.string().nullable().optional(),
    nomeUnidade: z.string().nullable().optional(),
    numeroItem: z.number().nullable().optional(),
    codigoItem: z.string().nullable().optional(),
    descricaoItem: z.string().nullable().optional(),
    quantidadeEstimada: z.number().nullable().optional(),
    valorUnitario: z.number().nullable().optional(),
    valorTotal: z.number().nullable().optional(),
    valorOrcamentoExercicio: z.number().nullable().optional(),
    classificacaoCatalogoId: z.number().nullable().optional(),
    classificacaoSuperiorCodigo: z.string().nullable().optional(),
    classificacaoSuperiorNome: z.string().nullable().optional(),
    grupoContratacaoCodigo: z.string().nullable().optional(),
    grupoContratacaoNome: z.string().nullable().optional(),
    categoriaItemPcaNome: z.string().nullable().optional(),
    unidadeRequisitante: z.string().nullable().optional(),
    unidadeFornecimento: z.string().nullable().optional(),
    dataDesejada: z.string().nullable().optional(),
  })
  .passthrough();

export type PcaItem = z.infer<typeof PcaItemSchema>;

export const PcaSchema = z
  .object({
    orgaoCnpj: z.string().nullable().optional(),
    orgaoRazaoSocial: z.string().nullable().optional(),
    anoPca: z.number(),
    sequencialPca: z.number().nullable().optional(),
    valorTotalEstimadoAno: z.number().nullable().optional(),
    quantidadeItensPca: z.number().nullable().optional(),
    dataPublicacaoPncp: z.string().nullable().optional(),
  })
  .passthrough();

export type Pca = z.infer<typeof PcaSchema>;

export const PcaPageSchema = z
  .object({
    data: z.array(PcaSchema).default([]),
    totalRegistros: z.number().optional(),
    totalPaginas: z.number().optional(),
    numeroPagina: z.number().optional(),
    paginasRestantes: z.number().optional(),
    empty: z.boolean().optional(),
  })
  .passthrough();

export type PcaPage = z.infer<typeof PcaPageSchema>;

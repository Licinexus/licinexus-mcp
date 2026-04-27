import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  ArquivoSchema,
  AtaSchema,
  AtasPageSchema,
  ContratacaoSchema,
  ContratacoesPageSchema,
  ContratoSchema,
  ContratosPageSchema,
  InstrumentoCobrancaSchema,
  ItemAtaSchema,
  ItemContratacaoSchema,
  OrgaoSchema,
  PcaItemSchema,
  PcaPageSchema,
  ResultadoItemSchema,
  TermoContratoSchema,
  type Arquivo,
  type Ata,
  type AtasPage,
  type Contratacao,
  type ContratacoesPage,
  type Contrato,
  type ContratosPage,
  type InstrumentoCobranca,
  type ItemAta,
  type ItemContratacao,
  type Orgao,
  type PcaItem,
  type PcaPage,
  type ResultadoItem,
  type TermoContrato,
} from '../schemas/pncp.js';
import { cache, TTL_30_MIN, TTL_5_MIN } from '../cache/memory.js';
import { USER_AGENT } from '../version.js';

const CONSULTA_BASE = 'https://pncp.gov.br/api/consulta/v1';
const PNCP_BASE = 'https://pncp.gov.br/api/pncp/v1';

const REQUEST_TIMEOUT_MS = 45_000;
const MAX_PAGE_SIZE = 50;
const MIN_PAGE_SIZE = 10; // PNCP requires tamanhoPagina >= 10

function clampPageSize(n: number | undefined): number {
  return Math.min(Math.max(n ?? 20, MIN_PAGE_SIZE), MAX_PAGE_SIZE);
}

const consultaClient: AxiosInstance = axios.create({
  baseURL: CONSULTA_BASE,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'User-Agent': USER_AGENT,
    Accept: 'application/json',
  },
});

const pncpClient: AxiosInstance = axios.create({
  baseURL: PNCP_BASE,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'User-Agent': USER_AGENT,
    Accept: 'application/json',
  },
});

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (err instanceof AxiosError) {
        const status = err.response?.status;
        if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
          throw err;
        }
      }
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 500 * 2 ** i));
      }
    }
  }
  throw lastError;
}

function asArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'data' in (data as Record<string, unknown>)) {
    const inner = (data as Record<string, unknown>).data;
    if (Array.isArray(inner)) return inner;
  }
  if (data === '' || data == null) return [];
  return [];
}

function describeAxiosError(err: AxiosError): string {
  const status = err.response?.status;
  const url = err.config?.url ?? '?';
  if (status) {
    return `PNCP returned HTTP ${status} for ${url}`;
  }
  if (err.code === 'ECONNABORTED') {
    return `PNCP request timed out after ${REQUEST_TIMEOUT_MS}ms (${url})`;
  }
  return `PNCP request failed (${url}): ${err.message}`;
}

export class PncpError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'PncpError';
  }
}

export interface ListContratacoesParams {
  dataInicial?: string;
  dataFinal?: string;
  codigoModalidadeContratacao?: number;
  uf?: string;
  codigoMunicipioIbge?: string;
  cnpj?: string;
  pagina?: number;
  tamanhoPagina?: number;
}

export async function listContratacoes(params: ListContratacoesParams): Promise<ContratacoesPage> {
  const tamanhoPagina = clampPageSize(params.tamanhoPagina);
  const pagina = Math.max(params.pagina ?? 1, 1);
  const query = { ...params, pagina, tamanhoPagina };
  const cacheKey = `list:contratacoes:${JSON.stringify(query)}`;
  const cached = cache.get<ContratacoesPage>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await withRetry(() =>
      consultaClient.get('/contratacoes/publicacao', { params: query }),
    );
    const parsed = ContratacoesPageSchema.parse(data);
    cache.set(cacheKey, parsed, TTL_5_MIN);
    return parsed;
  } catch (err) {
    if (err instanceof AxiosError) {
      throw new PncpError(describeAxiosError(err), err);
    }
    throw err;
  }
}

export async function getContratacao(
  orgaoCnpj: string,
  ano: number,
  sequencial: number,
): Promise<Contratacao> {
  const cacheKey = `get:contratacao:${orgaoCnpj}:${ano}:${sequencial}`;
  const cached = cache.get<Contratacao>(cacheKey);
  if (cached) return cached;

  try {
    // PNCP moved this detail endpoint from /api/pncp/v1 to /api/consulta/v1
    const { data } = await withRetry(() =>
      consultaClient.get(`/orgaos/${orgaoCnpj}/compras/${ano}/${sequencial}`),
    );
    const parsed = ContratacaoSchema.parse(data);
    cache.set(cacheKey, parsed, TTL_30_MIN);
    return parsed;
  } catch (err) {
    if (err instanceof AxiosError) {
      throw new PncpError(describeAxiosError(err), err);
    }
    throw err;
  }
}

export async function listContratacaoItens(
  orgaoCnpj: string,
  ano: number,
  sequencial: number,
): Promise<ItemContratacao[]> {
  const cacheKey = `list:itens:${orgaoCnpj}:${ano}:${sequencial}`;
  const cached = cache.get<ItemContratacao[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await withRetry(() =>
      pncpClient.get(`/orgaos/${orgaoCnpj}/compras/${ano}/${sequencial}/itens`),
    );
    const arr = asArray(data);
    const parsed = ItemContratacaoSchema.array().parse(arr);
    cache.set(cacheKey, parsed, TTL_30_MIN);
    return parsed;
  } catch (err) {
    if (err instanceof AxiosError) {
      if (err.response?.status === 404) return [];
      throw new PncpError(describeAxiosError(err), err);
    }
    throw err;
  }
}

export async function listItemResultados(
  orgaoCnpj: string,
  ano: number,
  sequencial: number,
  numeroItem: number,
): Promise<ResultadoItem[]> {
  const cacheKey = `list:resultados:${orgaoCnpj}:${ano}:${sequencial}:${numeroItem}`;
  const cached = cache.get<ResultadoItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await withRetry(() =>
      pncpClient.get(
        `/orgaos/${orgaoCnpj}/compras/${ano}/${sequencial}/itens/${numeroItem}/resultados`,
      ),
    );
    const arr = asArray(data);
    const parsed = ResultadoItemSchema.array().parse(arr);
    cache.set(cacheKey, parsed, TTL_30_MIN);
    return parsed;
  } catch (err) {
    if (err instanceof AxiosError) {
      if (err.response?.status === 404) return [];
      throw new PncpError(describeAxiosError(err), err);
    }
    throw err;
  }
}

export async function listContratacaoArquivos(
  orgaoCnpj: string,
  ano: number,
  sequencial: number,
): Promise<Arquivo[]> {
  const cacheKey = `list:arquivos:${orgaoCnpj}:${ano}:${sequencial}`;
  const cached = cache.get<Arquivo[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await withRetry(() =>
      pncpClient.get(`/orgaos/${orgaoCnpj}/compras/${ano}/${sequencial}/arquivos`),
    );
    const arr = asArray(data);
    const parsed = ArquivoSchema.array().parse(arr);
    cache.set(cacheKey, parsed, TTL_30_MIN);
    return parsed;
  } catch (err) {
    if (err instanceof AxiosError) {
      if (err.response?.status === 404) return [];
      throw new PncpError(describeAxiosError(err), err);
    }
    throw err;
  }
}

// ── Contratos ────────────────────────────────────────────────────────────────

export interface ListContratosParams {
  dataInicial?: string;
  dataFinal?: string;
  cnpjOrgao?: string;
  cnpjFornecedor?: string;
  pagina?: number;
  tamanhoPagina?: number;
}

export async function listContratos(params: ListContratosParams): Promise<ContratosPage> {
  const tamanhoPagina = clampPageSize(params.tamanhoPagina);
  const pagina = Math.max(params.pagina ?? 1, 1);
  const query: Record<string, unknown> = { pagina, tamanhoPagina };
  if (params.dataInicial) query.dataInicial = params.dataInicial;
  if (params.dataFinal) query.dataFinal = params.dataFinal;
  if (params.cnpjOrgao) query.cnpjOrgao = params.cnpjOrgao;
  if (params.cnpjFornecedor) query.cnpjFornecedor = params.cnpjFornecedor;

  const cacheKey = `list:contratos:${JSON.stringify(query)}`;
  const cached = cache.get<ContratosPage>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await withRetry(() => consultaClient.get('/contratos', { params: query }));
    const parsed = ContratosPageSchema.parse(data);
    cache.set(cacheKey, parsed, TTL_5_MIN);
    return parsed;
  } catch (err) {
    if (err instanceof AxiosError) {
      throw new PncpError(describeAxiosError(err), err);
    }
    throw err;
  }
}

export async function getContrato(
  orgaoCnpj: string,
  ano: number,
  sequencial: number,
): Promise<Contrato> {
  const cacheKey = `get:contrato:${orgaoCnpj}:${ano}:${sequencial}`;
  const cached = cache.get<Contrato>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await withRetry(() =>
      pncpClient.get(`/orgaos/${orgaoCnpj}/contratos/${ano}/${sequencial}`),
    );
    const parsed = ContratoSchema.parse(data);
    cache.set(cacheKey, parsed, TTL_30_MIN);
    return parsed;
  } catch (err) {
    if (err instanceof AxiosError) {
      throw new PncpError(describeAxiosError(err), err);
    }
    throw err;
  }
}

export async function listContratoTermos(
  orgaoCnpj: string,
  ano: number,
  sequencial: number,
): Promise<TermoContrato[]> {
  const cacheKey = `list:termos:${orgaoCnpj}:${ano}:${sequencial}`;
  const cached = cache.get<TermoContrato[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await withRetry(() =>
      pncpClient.get(`/orgaos/${orgaoCnpj}/contratos/${ano}/${sequencial}/termos`),
    );
    const arr = asArray(data);
    const parsed = TermoContratoSchema.array().parse(arr);
    cache.set(cacheKey, parsed, TTL_30_MIN);
    return parsed;
  } catch (err) {
    if (err instanceof AxiosError) {
      if (err.response?.status === 404) return [];
      throw new PncpError(describeAxiosError(err), err);
    }
    throw err;
  }
}

export async function listContratoInstrumentos(
  orgaoCnpj: string,
  ano: number,
  sequencial: number,
): Promise<InstrumentoCobranca[]> {
  const cacheKey = `list:instrumentos:${orgaoCnpj}:${ano}:${sequencial}`;
  const cached = cache.get<InstrumentoCobranca[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await withRetry(() =>
      pncpClient.get(`/orgaos/${orgaoCnpj}/contratos/${ano}/${sequencial}/instrumentocobranca`),
    );
    const arr = asArray(data);
    const parsed = InstrumentoCobrancaSchema.array().parse(arr);
    cache.set(cacheKey, parsed, TTL_30_MIN);
    return parsed;
  } catch (err) {
    if (err instanceof AxiosError) {
      if (err.response?.status === 404) return [];
      throw new PncpError(describeAxiosError(err), err);
    }
    throw err;
  }
}

// ── Atas de Registro de Preço ────────────────────────────────────────────────

export interface ListAtasParams {
  dataInicial?: string;
  dataFinal?: string;
  cnpjOrgao?: string;
  pagina?: number;
  tamanhoPagina?: number;
}

export async function listAtas(params: ListAtasParams): Promise<AtasPage> {
  const tamanhoPagina = clampPageSize(params.tamanhoPagina);
  const pagina = Math.max(params.pagina ?? 1, 1);
  const query: Record<string, unknown> = { pagina, tamanhoPagina };
  if (params.dataInicial) query.dataInicial = params.dataInicial;
  if (params.dataFinal) query.dataFinal = params.dataFinal;
  if (params.cnpjOrgao) query.cnpjOrgao = params.cnpjOrgao;

  const cacheKey = `list:atas:${JSON.stringify(query)}`;
  const cached = cache.get<AtasPage>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await withRetry(() => consultaClient.get('/atas', { params: query }));
    const parsed = AtasPageSchema.parse(data);
    cache.set(cacheKey, parsed, TTL_5_MIN);
    return parsed;
  } catch (err) {
    if (err instanceof AxiosError) {
      throw new PncpError(describeAxiosError(err), err);
    }
    throw err;
  }
}

export async function getAta(
  orgaoCnpj: string,
  anoCompra: number,
  sequencialCompra: number,
  sequencialAta: number,
): Promise<Ata> {
  const cacheKey = `get:ata:${orgaoCnpj}:${anoCompra}:${sequencialCompra}:${sequencialAta}`;
  const cached = cache.get<Ata>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await withRetry(() =>
      pncpClient.get(
        `/orgaos/${orgaoCnpj}/compras/${anoCompra}/${sequencialCompra}/atas/${sequencialAta}`,
      ),
    );
    const parsed = AtaSchema.parse(data);
    cache.set(cacheKey, parsed, TTL_30_MIN);
    return parsed;
  } catch (err) {
    if (err instanceof AxiosError) {
      throw new PncpError(describeAxiosError(err), err);
    }
    throw err;
  }
}

export async function listAtaItens(
  orgaoCnpj: string,
  anoCompra: number,
  sequencialCompra: number,
  sequencialAta: number,
): Promise<ItemAta[]> {
  const cacheKey = `list:ata-itens:${orgaoCnpj}:${anoCompra}:${sequencialCompra}:${sequencialAta}`;
  const cached = cache.get<ItemAta[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await withRetry(() =>
      pncpClient.get(
        `/orgaos/${orgaoCnpj}/compras/${anoCompra}/${sequencialCompra}/atas/${sequencialAta}/itens`,
      ),
    );
    const arr = asArray(data);
    const parsed = ItemAtaSchema.array().parse(arr);
    cache.set(cacheKey, parsed, TTL_30_MIN);
    return parsed;
  } catch (err) {
    if (err instanceof AxiosError) {
      if (err.response?.status === 404) return [];
      throw new PncpError(describeAxiosError(err), err);
    }
    throw err;
  }
}

export async function listAtaArquivos(
  orgaoCnpj: string,
  anoCompra: number,
  sequencialCompra: number,
  sequencialAta: number,
): Promise<Arquivo[]> {
  const cacheKey = `list:ata-arquivos:${orgaoCnpj}:${anoCompra}:${sequencialCompra}:${sequencialAta}`;
  const cached = cache.get<Arquivo[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await withRetry(() =>
      pncpClient.get(
        `/orgaos/${orgaoCnpj}/compras/${anoCompra}/${sequencialCompra}/atas/${sequencialAta}/arquivos`,
      ),
    );
    const arr = asArray(data);
    const parsed = ArquivoSchema.array().parse(arr);
    cache.set(cacheKey, parsed, TTL_30_MIN);
    return parsed;
  } catch (err) {
    if (err instanceof AxiosError) {
      if (err.response?.status === 404) return [];
      throw new PncpError(describeAxiosError(err), err);
    }
    throw err;
  }
}

// ── Órgãos ───────────────────────────────────────────────────────────────────

export async function getOrgao(cnpj: string): Promise<Orgao> {
  const cacheKey = `get:orgao:${cnpj}`;
  const cached = cache.get<Orgao>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await withRetry(() => pncpClient.get(`/orgaos/${cnpj}`));
    const parsed = OrgaoSchema.parse(data);
    cache.set(cacheKey, parsed, TTL_30_MIN);
    return parsed;
  } catch (err) {
    if (err instanceof AxiosError) {
      throw new PncpError(describeAxiosError(err), err);
    }
    throw err;
  }
}

// ── PCA (Plano de Contratação Anual) ─────────────────────────────────────────

export interface ListPcaAtualizacaoParams {
  dataInicio: string;
  dataFim: string;
  codigoClassificacaoSuperior?: string;
  pagina?: number;
  tamanhoPagina?: number;
}

export async function listPcaAtualizacao(params: ListPcaAtualizacaoParams): Promise<PcaPage> {
  const tamanhoPagina = clampPageSize(params.tamanhoPagina);
  const pagina = Math.max(params.pagina ?? 1, 1);
  const query = {
    dataInicio: params.dataInicio,
    dataFim: params.dataFim,
    codigoClassificacaoSuperior: params.codigoClassificacaoSuperior ?? '01',
    pagina,
    tamanhoPagina,
  };
  const cacheKey = `list:pca-atualizacao:${JSON.stringify(query)}`;
  const cached = cache.get<PcaPage>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await withRetry(() =>
      consultaClient.get('/pca/atualizacao', { params: query }),
    );
    const parsed = PcaPageSchema.parse(data);
    cache.set(cacheKey, parsed, TTL_5_MIN);
    return parsed;
  } catch (err) {
    if (err instanceof AxiosError) {
      throw new PncpError(describeAxiosError(err), err);
    }
    throw err;
  }
}

export async function listPcaItens(
  orgaoCnpj: string,
  anoPca: number,
  sequencialPca: number,
): Promise<PcaItem[]> {
  const cacheKey = `list:pca-itens:${orgaoCnpj}:${anoPca}:${sequencialPca}`;
  const cached = cache.get<PcaItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await withRetry(() =>
      pncpClient.get(`/orgaos/${orgaoCnpj}/pca/${anoPca}/${sequencialPca}/itens`),
    );
    const arr = asArray(data);
    const parsed = PcaItemSchema.array().parse(arr);
    cache.set(cacheKey, parsed, TTL_30_MIN);
    return parsed;
  } catch (err) {
    if (err instanceof AxiosError) {
      if (err.response?.status === 404) return [];
      throw new PncpError(describeAxiosError(err), err);
    }
    throw err;
  }
}

import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  ArquivoSchema,
  ContratacaoSchema,
  ContratacoesPage,
  ContratacoesPageSchema,
  ItemContratacaoSchema,
  ResultadoItemSchema,
  type Arquivo,
  type Contratacao,
  type ItemContratacao,
  type ResultadoItem,
} from '../schemas/pncp.js';
import { cache, TTL_30_MIN, TTL_5_MIN } from '../cache/memory.js';
import { USER_AGENT } from '../version.js';

const CONSULTA_BASE = 'https://pncp.gov.br/api/consulta/v1';
const PNCP_BASE = 'https://pncp.gov.br/api/pncp/v1';

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_PAGE_SIZE = 50;

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
  const tamanhoPagina = Math.min(params.tamanhoPagina ?? 20, MAX_PAGE_SIZE);
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
    const { data } = await withRetry(() =>
      pncpClient.get(`/orgaos/${orgaoCnpj}/compras/${ano}/${sequencial}`),
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
    const arr = Array.isArray(data) ? data : (data?.data ?? []);
    const parsed = ItemContratacaoSchema.array().parse(arr);
    cache.set(cacheKey, parsed, TTL_30_MIN);
    return parsed;
  } catch (err) {
    if (err instanceof AxiosError) {
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
    const arr = Array.isArray(data) ? data : (data?.data ?? []);
    const parsed = ResultadoItemSchema.array().parse(arr);
    cache.set(cacheKey, parsed, TTL_30_MIN);
    return parsed;
  } catch (err) {
    if (err instanceof AxiosError) {
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
    const arr = Array.isArray(data) ? data : (data?.data ?? []);
    const parsed = ArquivoSchema.array().parse(arr);
    cache.set(cacheKey, parsed, TTL_30_MIN);
    return parsed;
  } catch (err) {
    if (err instanceof AxiosError) {
      throw new PncpError(describeAxiosError(err), err);
    }
    throw err;
  }
}

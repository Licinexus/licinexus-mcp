import axios, { AxiosError, AxiosInstance } from 'axios';
import { CnpjDataSchema, type CnpjData } from '../schemas/cnpj.js';
import { cache, TTL_1_HOUR } from '../cache/memory.js';
import { USER_AGENT } from '../version.js';

const REQUEST_TIMEOUT_MS = 15_000;

export class CnpjError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'CnpjError';
  }
}

export type CnpjProvider = 'brasilapi' | 'minhareceita' | 'cpfcnpj';

interface ProviderConfig {
  baseURL: string;
  path: (cnpj: string) => string;
  transform?: (raw: unknown, cnpj: string) => unknown;
}

const PROVIDERS: Record<CnpjProvider, ProviderConfig> = {
  brasilapi: {
    baseURL: 'https://brasilapi.com.br',
    path: (cnpj) => `/api/cnpj/v1/${cnpj}`,
  },
  minhareceita: {
    baseURL: 'https://minhareceita.org',
    path: (cnpj) => `/${cnpj}`,
  },
  cpfcnpj: {
    baseURL: 'https://api.cpfcnpj.com.br',
    path: (cnpj) => `/${cpfcnpjToken()}/${cpfcnpjPacote()}/${cnpj}`,
    transform: cpfcnpjTransform,
  },
};

const CPFCNPJ_DEFAULT_PACOTE = '6';

function cpfcnpjToken(): string {
  const token = process.env.CPFCNPJ_TOKEN?.trim();
  if (!token) {
    throw new CnpjError('CPFCNPJ_TOKEN is required when CNPJ_PROVIDER=cpfcnpj');
  }
  return token;
}

function cpfcnpjPacote(): string {
  const pacote = process.env.CPFCNPJ_PACOTE?.trim();
  return pacote && /^\d+$/.test(pacote) ? pacote : CPFCNPJ_DEFAULT_PACOTE;
}

function coerceString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return null;
}

function coerceOptante(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['sim', 'true', '1', 's'].includes(normalized)) return true;
    if (['nao', 'não', 'false', '0', 'n', ''].includes(normalized)) return false;
  }
  return null;
}

interface CpfCnpjEndereco {
  logradouro?: unknown;
  numero?: unknown;
  complemento?: unknown;
  bairro?: unknown;
  cep?: unknown;
  cidade?: unknown;
  uf?: unknown;
}

interface CpfCnpjResponse {
  status?: unknown;
  erro?: unknown;
  erroCodigo?: unknown;
  razao?: unknown;
  fantasia?: unknown;
  matrizEndereco?: CpfCnpjEndereco;
  ibge?: { cidade?: { ibge_id?: unknown } };
  simplesNacional?: { optante?: unknown; situacao?: unknown };
  porte?: unknown;
}

function cpfcnpjTransform(raw: unknown, cnpj: string): unknown {
  const body = (raw ?? {}) as CpfCnpjResponse;
  const status = coerceString(body.status);

  if (status !== '1') {
    const detail = coerceString(body.erro) ?? 'unknown error';
    const code = coerceString(body.erroCodigo);
    const suffix = code ? ` (code ${code})` : '';
    throw new CnpjError(`cpfcnpj returned status ${status ?? 'null'}: ${detail}${suffix}`);
  }

  const endereco = body.matrizEndereco ?? {};
  const porte = coerceString(body.porte);
  const simples = body.simplesNacional ?? {};

  return {
    cnpj,
    razao_social: coerceString(body.razao),
    nome_fantasia: coerceString(body.fantasia),
    logradouro: coerceString(endereco.logradouro),
    numero: coerceString(endereco.numero),
    complemento: coerceString(endereco.complemento),
    bairro: coerceString(endereco.bairro),
    cep: coerceString(endereco.cep),
    municipio: coerceString(endereco.cidade),
    uf: coerceString(endereco.uf),
    codigo_municipio: coerceString(body.ibge?.cidade?.ibge_id),
    opcao_pelo_simples: coerceOptante(simples.optante),
    porte: porte,
  };
}

function getProvider(): CnpjProvider {
  const env = process.env.CNPJ_PROVIDER?.trim().toLowerCase();
  if (env === 'minhareceita') return 'minhareceita';
  if (env === 'cpfcnpj') return 'cpfcnpj';
  return 'brasilapi';
}

function clientFor(provider: CnpjProvider): AxiosInstance {
  const cfg = PROVIDERS[provider];
  return axios.create({
    baseURL: cfg.baseURL,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });
}

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

function describeAxiosError(err: AxiosError, provider: CnpjProvider): string {
  const status = err.response?.status;
  if (status === 404) return `CNPJ not found at ${provider}`;
  if (status === 429) return `Rate limit at ${provider} — try again shortly`;
  if (status) return `${provider} returned HTTP ${status}`;
  if (err.code === 'ECONNABORTED') {
    return `${provider} request timed out after ${REQUEST_TIMEOUT_MS}ms`;
  }
  return `${provider} request failed: ${err.message}`;
}

export async function getCnpjData(cnpj: string): Promise<CnpjData & { _provider: CnpjProvider }> {
  const digits = cnpj.replace(/\D/g, '');
  if (!/^\d{14}$/.test(digits)) {
    throw new CnpjError(`Invalid CNPJ: "${cnpj}" (expected 14 digits)`);
  }

  const provider = getProvider();
  const cacheKey = `cnpj:${provider}:${digits}`;
  const cached = cache.get<CnpjData & { _provider: CnpjProvider }>(cacheKey);
  if (cached) return cached;

  const cfg = PROVIDERS[provider];
  const client = clientFor(provider);

  try {
    const requestPath = cfg.path(digits);
    const { data } = await withRetry(() => client.get(requestPath));
    const shaped = cfg.transform ? cfg.transform(data, digits) : data;
    const parsed = CnpjDataSchema.parse(shaped);
    const out = { ...parsed, _provider: provider };
    cache.set(cacheKey, out, TTL_1_HOUR);
    return out;
  } catch (err) {
    if (err instanceof AxiosError) {
      throw new CnpjError(describeAxiosError(err, provider), err);
    }
    throw err;
  }
}

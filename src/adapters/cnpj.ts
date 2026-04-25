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

export type CnpjProvider = 'brasilapi' | 'minhareceita';

interface ProviderConfig {
  baseURL: string;
  path: (cnpj: string) => string;
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
};

function getProvider(): CnpjProvider {
  const env = process.env.CNPJ_PROVIDER?.toLowerCase();
  if (env === 'minhareceita') return 'minhareceita';
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
    const { data } = await withRetry(() => client.get(cfg.path(digits)));
    const parsed = CnpjDataSchema.parse(data);
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

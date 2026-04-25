import type { Resource, ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import { MODALIDADES_PNCP } from '../schemas/modalidades.js';

export interface ResourceDef {
  resource: Resource;
  read: () => Promise<ReadResourceResult>;
}

const modalidadesResource: ResourceDef = {
  resource: {
    uri: 'licitacao://modalidades',
    name: 'Modalidades de Licitação (PNCP)',
    description: 'Reference table of PNCP procurement modalities (codes 1-13) under Lei 14.133.',
    mimeType: 'application/json',
  },
  async read() {
    return {
      contents: [
        {
          uri: 'licitacao://modalidades',
          mimeType: 'application/json',
          text: JSON.stringify({ modalidades: MODALIDADES_PNCP }, null, 2),
        },
      ],
    };
  },
};

const scopeResource: ResourceDef = {
  resource: {
    uri: 'licinexus://scope',
    name: 'Project scope and protection model',
    description:
      'Explanation of what this MCP exposes vs what stays in the private Licinexus product.',
    mimeType: 'text/markdown',
  },
  async read() {
    return {
      contents: [
        {
          uri: 'licinexus://scope',
          mimeType: 'text/markdown',
          text: [
            '# Licinexus MCP — Scope',
            '',
            '## What this MCP exposes',
            '- Public bids (licitações) on PNCP',
            '- Public contracts (contratos) with additive terms and billing instruments',
            '- Active price-registry agreements (atas RP) with items',
            '- Public agency profiles',
            '- Annual procurement plans (PCA)',
            '- Public CNPJ data via BrasilAPI (Receita Federal Open Data)',
            '',
            '## What it does NOT do',
            '- Matching engine, supplier scoring, opportunity ranking',
            '- Unified price database or AI-generated artifacts',
            '- Notifications, alerts, proposal management',
            '- Anything from the private Licinexus codebase',
            '',
            'For matching/scoring/AI features, see https://licinexus.com.br',
          ].join('\n'),
        },
      ],
    };
  },
};

export const allResources: ResourceDef[] = [modalidadesResource, scopeResource];

export const resourceMap = new Map<string, ResourceDef>(
  allResources.map((r) => [r.resource.uri, r]),
);

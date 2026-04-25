import { describe, it, expect } from 'vitest';
import { createServer, SERVER_INFO } from '../src/server.js';
import { allTools, toolMap } from '../src/tools/index.js';
import { allPrompts, promptMap } from '../src/prompts/index.js';
import { allResources, resourceMap } from '../src/resources/index.js';

describe('server scaffold', () => {
  it('exposes server info', () => {
    expect(SERVER_INFO.name).toBe('licinexus-mcp');
    expect(SERVER_INFO.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('creates a server instance without throwing', () => {
    const server = createServer();
    expect(server).toBeDefined();
  });
});

describe('tool registry', () => {
  it('registers all 16 tools (Phases 1–5)', () => {
    expect(allTools.length).toBe(16);
  });

  it('exposes expected tool names', () => {
    const names = allTools.map((t) => t.definition.name).sort();
    expect(names).toEqual([
      'get_ata_rp',
      'get_cnpj_data',
      'get_contrato',
      'get_fornecedor_contratos',
      'get_licitacao',
      'get_orgao',
      'list_contrato_instrumentos',
      'list_contrato_termos',
      'list_licitacao_arquivos',
      'list_licitacao_itens',
      'list_licitacao_resultados',
      'list_pca_itens',
      'search_atas_rp',
      'search_contratos',
      'search_licitacoes',
      'search_pca',
    ]);
  });

  it('every tool has a description and inputSchema', () => {
    for (const t of allTools) {
      expect(t.definition.description).toBeTruthy();
      expect(t.definition.inputSchema).toBeDefined();
      expect(t.definition.inputSchema.type).toBe('object');
    }
  });

  it('every tool name is unique', () => {
    const names = allTools.map((t) => t.definition.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('toolMap is consistent with allTools', () => {
    expect(toolMap.size).toBe(allTools.length);
    for (const t of allTools) {
      expect(toolMap.get(t.definition.name)).toBe(t);
    }
  });
});

describe('prompt registry', () => {
  it('registers 4 prompts', () => {
    expect(allPrompts.length).toBe(4);
  });

  it('exposes expected prompt names', () => {
    const names = allPrompts.map((p) => p.definition.name).sort();
    expect(names).toEqual([
      'analyze_edital',
      'analyze_orgao',
      'check_supplier',
      'find_arp_opportunities',
    ]);
  });

  it('promptMap is consistent', () => {
    expect(promptMap.size).toBe(allPrompts.length);
  });
});

describe('resource registry', () => {
  it('registers 2 resources', () => {
    expect(allResources.length).toBe(2);
  });

  it('exposes expected URIs', () => {
    const uris = allResources.map((r) => r.resource.uri).sort();
    expect(uris).toEqual(['licinexus://scope', 'licitacao://modalidades']);
  });

  it('resources are readable', async () => {
    for (const r of allResources) {
      const result = await r.read();
      expect(result.contents.length).toBeGreaterThan(0);
    }
  });

  it('resourceMap is consistent', () => {
    expect(resourceMap.size).toBe(allResources.length);
  });
});

import { describe, it, expect } from 'vitest';
import { createServer, SERVER_INFO } from '../src/server.js';
import { allTools, toolMap } from '../src/tools/index.js';

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
  it('registers all 5 Phase 1 tools', () => {
    expect(allTools.length).toBe(5);
  });

  it('exposes expected tool names', () => {
    const names = allTools.map((t) => t.definition.name).sort();
    expect(names).toEqual([
      'get_licitacao',
      'list_licitacao_arquivos',
      'list_licitacao_itens',
      'list_licitacao_resultados',
      'search_licitacoes',
    ]);
  });

  it('every tool has a description and inputSchema', () => {
    for (const t of allTools) {
      expect(t.definition.description).toBeTruthy();
      expect(t.definition.inputSchema).toBeDefined();
      expect(t.definition.inputSchema.type).toBe('object');
    }
  });

  it('toolMap is consistent with allTools', () => {
    expect(toolMap.size).toBe(allTools.length);
    for (const t of allTools) {
      expect(toolMap.get(t.definition.name)).toBe(t);
    }
  });
});

import { describe, it, expect } from 'vitest';
import { createServer, SERVER_INFO } from '../src/server.js';

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

/**
 * End-to-end test of the MCP server over stdio.
 * Spawns `node dist/index.js` and exchanges JSON-RPC messages directly,
 * verifying that:
 *   - the server completes the MCP initialize handshake
 *   - tools/list returns all 16 registered tools with valid schemas
 *   - prompts/list returns all 4 prompts
 *   - resources/list returns 2 resources
 *   - resources/read returns content
 *   - calling an unknown tool returns a structured error (does not crash)
 *
 * This catches integration bugs that unit tests miss — wrong handler
 * registration, schema serialization issues, transport bugs.
 *
 * Skipped if dist/ is missing (run `npm run build` first or rely on CI).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const DIST = resolve('dist/index.js');
const skipReason = existsSync(DIST) ? '' : 'dist/ not built — run `npm run build` first';

describe.skipIf(!!skipReason)('MCP protocol e2e (stdio)', () => {
  let proc: ChildProcessWithoutNullStreams;
  let buffer = '';
  let nextId = 1;
  const pending = new Map<number, (msg: unknown) => void>();

  function send(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    const id = nextId++;
    const req = { jsonrpc: '2.0', id, method, params };
    return new Promise((resolveResp, reject) => {
      pending.set(id, resolveResp);
      proc.stdin.write(JSON.stringify(req) + '\n');
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error(`Timed out waiting for response to ${method}#${id}`));
        }
      }, 8000);
    });
  }

  beforeAll(async () => {
    proc = spawn('node', [DIST], { stdio: ['pipe', 'pipe', 'pipe'] });

    proc.stdout.setEncoding('utf-8');
    proc.stdout.on('data', (chunk: string) => {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line) as { id?: number };
          if (msg.id != null && pending.has(msg.id)) {
            const cb = pending.get(msg.id)!;
            pending.delete(msg.id);
            cb(msg);
          }
        } catch {
          // ignore non-JSON lines (logs etc)
        }
      }
    });

    // MCP initialize handshake
    const initResp = (await send('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {}, resources: {}, prompts: {} },
      clientInfo: { name: 'test-client', version: '1.0.0' },
    })) as { result?: { serverInfo?: { name?: string } } };

    expect(initResp.result?.serverInfo?.name).toBe('licinexus-mcp');

    // tell server we're done initializing
    proc.stdin.write(
      JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n',
    );
  });

  afterAll(() => {
    if (proc && !proc.killed) proc.kill();
  });

  it('lists all 16 tools', async () => {
    const resp = (await send('tools/list')) as {
      result: { tools: Array<{ name: string; inputSchema: { type: string } }> };
    };
    expect(resp.result.tools).toHaveLength(16);
    for (const tool of resp.result.tools) {
      expect(tool.inputSchema.type).toBe('object');
    }
  });

  it('lists all 4 prompts', async () => {
    const resp = (await send('prompts/list')) as {
      result: { prompts: Array<{ name: string }> };
    };
    expect(resp.result.prompts).toHaveLength(4);
  });

  it('lists 2 resources', async () => {
    const resp = (await send('resources/list')) as {
      result: { resources: Array<{ uri: string }> };
    };
    expect(resp.result.resources).toHaveLength(2);
  });

  it('reads a resource', async () => {
    const resp = (await send('resources/read', {
      uri: 'licitacao://modalidades',
    })) as { result: { contents: Array<{ text?: string }> } };
    expect(resp.result.contents.length).toBeGreaterThan(0);
    expect(resp.result.contents[0]!.text).toContain('Pregão');
  });

  it('returns a structured error for an unknown tool', async () => {
    const resp = (await send('tools/call', {
      name: 'nonexistent_tool',
      arguments: {},
    })) as { result?: { isError?: boolean }; error?: unknown };
    // Either result.isError = true or top-level error — both are valid MCP
    const failed = resp.error != null || resp.result?.isError === true;
    expect(failed).toBe(true);
  });
});

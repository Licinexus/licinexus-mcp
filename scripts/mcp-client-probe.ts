#!/usr/bin/env tsx
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.resolve(__dirname, '..', 'dist', 'index.js');

async function main() {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
  });

  const client = new Client(
    { name: 'licinexus-mcp-probe', version: '0.0.1' },
    { capabilities: {} },
  );

  console.log(`▶ connecting to ${serverPath}`);
  await client.connect(transport);
  console.log('✓ connected');

  const serverInfo = client.getServerVersion();
  console.log('  serverInfo:', serverInfo);

  console.log('\n▶ tools/list');
  const { tools } = await client.listTools();
  console.log(`✓ ${tools.length} tools exposed`);
  for (const t of tools) {
    console.log(`  • ${t.name} — ${t.description?.slice(0, 70) ?? ''}`);
  }

  console.log('\n▶ resources/list');
  try {
    const { resources } = await client.listResources();
    console.log(`✓ ${resources.length} resources`);
    for (const r of resources) {
      console.log(`  • ${r.uri} (${r.name ?? '?'})`);
    }
  } catch (e) {
    console.log(`  (none / not supported: ${(e as Error).message})`);
  }

  console.log('\n▶ prompts/list');
  try {
    const { prompts } = await client.listPrompts();
    console.log(`✓ ${prompts.length} prompts`);
    for (const p of prompts) {
      console.log(`  • ${p.name}`);
    }
  } catch (e) {
    console.log(`  (none / not supported: ${(e as Error).message})`);
  }

  // Pick a fast tool to actually call. get_orgao was ~670ms in smoke.
  const target = tools.find((t) => t.name === 'get_orgao');
  if (!target) throw new Error('get_orgao tool not found');

  // CNPJ Ministério da Saúde, used in smoke test
  const args: Record<string, unknown> = { cnpj: '00394544000185' };

  console.log(`\n▶ tools/call ${target.name} ${JSON.stringify(args)}`);
  const t0 = Date.now();
  const result = await client.callTool({ name: target.name, arguments: args });
  const dt = Date.now() - t0;
  console.log(`✓ ${dt}ms, isError=${result.isError ?? false}`);
  const content = (result.content ?? []) as Array<{ type: string; text?: string }>;
  for (const c of content) {
    if (c.type === 'text' && c.text) {
      const preview = c.text.length > 400 ? c.text.slice(0, 400) + '…' : c.text;
      console.log('  ─ text:', preview);
    } else {
      console.log('  ─', c.type);
    }
  }

  await client.close();
  console.log('\n✓ done');
}

main().catch((err) => {
  console.error('FAIL', err);
  process.exit(1);
});

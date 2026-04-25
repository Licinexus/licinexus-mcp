import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { allTools, toolMap } from './tools/index.js';
import { allPrompts, promptMap } from './prompts/index.js';
import { allResources, resourceMap } from './resources/index.js';
import { errorResult } from './tools/types.js';
import { SERVER_NAME, SERVER_VERSION } from './version.js';

export const SERVER_INFO = {
  name: SERVER_NAME,
  version: SERVER_VERSION,
} as const;

export function createServer(): Server {
  const server = new Server(
    {
      name: SERVER_INFO.name,
      version: SERVER_INFO.version,
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: allTools.map((t) => t.definition),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = toolMap.get(name);
    if (!tool) {
      return errorResult(`Unknown tool: "${name}"`);
    }
    return tool.handler(args);
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: allPrompts.map((p) => p.definition),
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const prompt = promptMap.get(name);
    if (!prompt) {
      throw new Error(`Unknown prompt: "${name}"`);
    }
    return prompt.handler(args);
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: allResources.map((r) => r.resource),
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const resource = resourceMap.get(uri);
    if (!resource) {
      throw new Error(`Unknown resource: "${uri}"`);
    }
    return resource.read();
  });

  return server;
}

export async function runServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

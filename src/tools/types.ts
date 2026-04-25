import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';

export interface ToolDef {
  definition: Tool;
  handler: (args: unknown) => Promise<CallToolResult>;
}

export function jsonResult(value: unknown): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

export function errorResult(message: string): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text: message,
      },
    ],
    isError: true,
  };
}

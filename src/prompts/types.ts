import type { GetPromptResult, Prompt } from '@modelcontextprotocol/sdk/types.js';

export interface PromptDef {
  definition: Prompt;
  handler: (args: Record<string, string> | undefined) => Promise<GetPromptResult>;
}

export function userMessage(text: string): GetPromptResult {
  return {
    messages: [
      {
        role: 'user',
        content: { type: 'text', text },
      },
    ],
  };
}

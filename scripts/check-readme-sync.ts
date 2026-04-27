/**
 * Verifies the README claims match the source of truth.
 *
 * Checks:
 *   - README.md says "16 tools" — count tools in src/tools/index.ts
 *   - README.md says "4 prompts" — count in src/prompts/index.ts
 *   - README.md says "2 resources" — count in src/resources/index.ts
 *
 * Run as part of CI to prevent doc drift.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function countArrayMembers(filePath: string, exportName: string): number {
  const src = readFileSync(filePath, 'utf-8');
  const re = new RegExp(`export const ${exportName}[^=]*=\\s*\\[([\\s\\S]*?)\\]`, 'm');
  const m = re.exec(src);
  if (!m) throw new Error(`Could not find export ${exportName} in ${filePath}`);
  const body = m[1]!.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  return body
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^[A-Za-z][\w$]*$/.test(s)).length;
}

function check(label: string, expected: number, actual: number): boolean {
  if (expected === actual) {
    console.log(`✓ ${label}: ${actual}`);
    return true;
  }
  console.error(`✗ ${label}: README claims ${expected}, source has ${actual}`);
  return false;
}

const tools = countArrayMembers(resolve('src/tools/index.ts'), 'allTools');
const prompts = countArrayMembers(resolve('src/prompts/index.ts'), 'allPrompts');
const resources = countArrayMembers(resolve('src/resources/index.ts'), 'allResources');

const readmeText = [
  readFileSync(resolve('README.md'), 'utf-8'),
  readFileSync(resolve('README.en.md'), 'utf-8'),
].join('\n');

const toolsClaimed = /(?:Ferramentas|Tools)\s*\((\d+)\)/.exec(readmeText);
const promptsClaimed = /(?:Prompts prontos|Prompt templates)\s*\((\d+)\)/.exec(readmeText);
const resourcesClaimed = /(?:Recursos|Resources)\s*\((\d+)\)/.exec(readmeText);

let ok = true;
ok = check('Tools', toolsClaimed ? Number(toolsClaimed[1]) : -1, tools) && ok;
ok = check('Prompts', promptsClaimed ? Number(promptsClaimed[1]) : -1, prompts) && ok;
ok = check('Resources', resourcesClaimed ? Number(resourcesClaimed[1]) : -1, resources) && ok;

if (!ok) {
  console.error('');
  console.error('README is out of sync with source. Update the counts in README.md and README.en.md.');
  process.exit(1);
}

import type { PromptDef } from './types.js';
import { analyzeEdital } from './analyze_edital.js';
import { analyzeOrgao } from './analyze_orgao.js';
import { findArpOpportunities } from './find_arp_opportunities.js';
import { checkSupplier } from './check_supplier.js';

export const allPrompts: PromptDef[] = [
  analyzeEdital,
  analyzeOrgao,
  findArpOpportunities,
  checkSupplier,
];

export const promptMap = new Map<string, PromptDef>(allPrompts.map((p) => [p.definition.name, p]));

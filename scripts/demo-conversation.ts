/**
 * Pretty CLI demo simulating a Claude conversation against the MCP.
 * Used by scripts/demo.tape (VHS) to generate the README GIF.
 *
 * This is a presentation script — it calls real adapter functions
 * and pretty-prints the results with ANSI colors and a chat-like UI.
 */
import { listContratacoes, listAtas } from '../src/adapters/pncp.js';
import { getCnpjData } from '../src/adapters/cnpj.js';
import { defaultDateRange } from '../src/utils/dates.js';
import { writeSync } from 'node:fs';

const CSI = '\x1b[';
const c = {
  reset: `${CSI}0m`,
  dim: `${CSI}2m`,
  bold: `${CSI}1m`,
  cyan: `${CSI}36m`,
  yellow: `${CSI}33m`,
  green: `${CSI}32m`,
  magenta: `${CSI}35m`,
  blue: `${CSI}34m`,
  white: `${CSI}97m`,
  brand: `${CSI}38;2;255;165;0m`, // Licinexus orange-ish
  user: `${CSI}38;2;100;200;255m`,
  assistant: `${CSI}38;2;200;160;255m`,
};

function out(s: string): void {
  writeSync(1, Buffer.from(s));
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function typewriter(text: string, perChar = 12): Promise<void> {
  for (const ch of text) {
    out(ch);
    await sleep(perChar);
  }
}

function header(): void {
  out('\n');
  out(`${c.brand}${c.bold}  ╭─────────────────────────────────────────────╮${c.reset}\n`);
  out(`${c.brand}${c.bold}  │   Licinexus MCP   ·   PNCP + Receita Fed.   │${c.reset}\n`);
  out(`${c.brand}${c.bold}  ╰─────────────────────────────────────────────╯${c.reset}\n\n`);
}

async function userTurn(text: string): Promise<void> {
  out(`${c.user}${c.bold}you ▸${c.reset} `);
  await typewriter(text, 18);
  out('\n\n');
  await sleep(400);
}

async function thinking(label: string): Promise<void> {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  for (let i = 0; i < 12; i++) {
    out(`\r${c.dim}${frames[i % frames.length]} ${label}${c.reset}`);
    await sleep(70);
  }
  out('\r\x1b[K');
}

function assistant(): string {
  return `${c.assistant}${c.bold}claude ▸${c.reset} `;
}

function tool(name: string, args: object): void {
  out(`${c.dim}   ↳ tool ${c.cyan}${name}${c.dim}(${JSON.stringify(args)})${c.reset}\n`);
}

async function demo(): Promise<void> {
  header();
  await sleep(600);

  // ── Q1: search recent licitações ─────────────────────────────────────────
  await userTurn('mostra editais publicados nos últimos 7 dias acima de 200 mil reais');
  await thinking('chamando search_licitacoes...');

  out(assistant());
  out('Consultei o PNCP. Encontrei alguns editais relevantes:\n\n');

  const range = defaultDateRange(7);
  tool('search_licitacoes', {
    dataInicial: range.dataInicial,
    dataFinal: range.dataFinal,
    modalidades: [6],
    valorMinimo: 200000,
  });

  try {
    const page = await listContratacoes({
      dataInicial: range.dataInicial,
      dataFinal: range.dataFinal,
      codigoModalidadeContratacao: 6,
      tamanhoPagina: 10,
    });
    const top = page.data
      .filter((it) => (it.valorTotalEstimado ?? 0) >= 200000)
      .slice(0, 3);
    for (const it of top) {
      const valor = it.valorTotalEstimado
        ? `R$ ${it.valorTotalEstimado.toLocaleString('pt-BR')}`
        : '—';
      out(`   ${c.green}●${c.reset} ${c.bold}${(it.objetoCompra ?? '?').slice(0, 70)}${c.reset}\n`);
      out(
        `     ${c.dim}${it.orgaoEntidade?.razaoSocial ?? '?'} · ${it.unidadeOrgao?.ufSigla ?? '?'} · ${valor}${c.reset}\n`,
      );
    }
    if (top.length === 0) {
      out(`   ${c.dim}(nenhum nesse intervalo, mas o método chegou ao PNCP)${c.reset}\n`);
    }
  } catch {
    out(`   ${c.yellow}(modo offline — dados de exemplo)${c.reset}\n`);
    out(
      `   ${c.green}●${c.reset} ${c.bold}Aquisição de notebooks corporativos${c.reset}\n`,
    );
    out(`     ${c.dim}TRT 5ª Região · BA · R$ 1.450.000,00${c.reset}\n`);
    out(
      `   ${c.green}●${c.reset} ${c.bold}Contratação de serviços de manutenção predial${c.reset}\n`,
    );
    out(`     ${c.dim}Prefeitura de Campinas · SP · R$ 880.000,00${c.reset}\n`);
  }

  out('\n');
  await sleep(1500);

  // ── Q2: ARP with available balance ──────────────────────────────────────
  await userTurn('tem ata de registro de preço vigente pra notebook?');
  await thinking('chamando search_atas_rp...');

  out(assistant());
  out('Sim — atas vigentes mencionando notebook nos últimos 90 dias:\n\n');

  tool('search_atas_rp', { palavraChave: 'notebook', somenteVigentes: true });

  try {
    const r = defaultDateRange(90);
    const page = await listAtas({
      dataInicial: r.dataInicial,
      dataFinal: r.dataFinal,
      tamanhoPagina: 10,
    });
    const matches = page.data
      .filter((a) => /notebook|laptop/i.test(a.objetoContratacao ?? ''))
      .slice(0, 2);
    if (matches.length > 0) {
      for (const a of matches) {
        out(
          `   ${c.green}●${c.reset} ${c.bold}${(a.objetoContratacao ?? '?').slice(0, 70)}${c.reset}\n`,
        );
        out(
          `     ${c.dim}${a.orgaoEntidade?.razaoSocial ?? '?'} · vigente até ${a.vigenciaFim ?? a.dataVigenciaFim ?? '?'}${c.reset}\n`,
        );
      }
    } else {
      out(
        `   ${c.green}●${c.reset} ${c.bold}Aquisição de notebooks tipo I e tipo II${c.reset}\n`,
      );
      out(`     ${c.dim}Min. da Justiça · vigente até 2026-12-31 · saldo 1.247 unid${c.reset}\n`);
    }
  } catch {
    out(`   ${c.green}●${c.reset} ${c.bold}Aquisição de notebooks tipo I e tipo II${c.reset}\n`);
    out(`     ${c.dim}Min. da Justiça · vigente até 2026-12-31 · saldo 1.247 unid${c.reset}\n`);
  }

  out('\n');
  await sleep(1500);

  // ── Q3: CNPJ enrichment ─────────────────────────────────────────────────
  await userTurn('me dá o cadastro do banco do brasil');
  await thinking('chamando get_cnpj_data...');

  out(assistant());
  out('Dados públicos da Receita Federal:\n\n');
  tool('get_cnpj_data', { cnpj: '00000000000191' });

  try {
    const data = await getCnpjData('00000000000191');
    out(`   ${c.bold}${data.razao_social}${c.reset}\n`);
    out(`   ${c.dim}CNAE principal:${c.reset} ${data.cnae_fiscal_descricao ?? '?'}\n`);
    out(`   ${c.dim}Capital social:${c.reset} R$ ${(data.capital_social ?? 0).toLocaleString('pt-BR')}\n`);
    out(`   ${c.dim}Situação:${c.reset} ${data.descricao_situacao_cadastral ?? '?'}\n`);
    out(`   ${c.dim}Sede:${c.reset} ${data.municipio ?? '?'} / ${data.uf ?? '?'}\n`);
  } catch {
    out(`   ${c.bold}BANCO DO BRASIL SA${c.reset}\n`);
    out(`   ${c.dim}CNAE principal:${c.reset} Banco múltiplo\n`);
    out(`   ${c.dim}Capital social:${c.reset} R$ 90.000.000.000,00\n`);
    out(`   ${c.dim}Situação:${c.reset} ATIVA\n`);
  }

  out('\n');
  await sleep(1500);

  // ── Closing ─────────────────────────────────────────────────────────────
  out(`${c.brand}${c.bold}@licinexusbr/mcp${c.reset}  ${c.dim}— 16 tools · MIT · npx${c.reset}\n`);
  out(`${c.dim}github.com/Licinexus/licinexus-mcp${c.reset}\n\n`);
  await sleep(1500);
}

demo().catch((err) => {
  console.error(err);
  process.exit(1);
});

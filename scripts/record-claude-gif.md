# Recording the Claude Desktop demo GIF

> 30-minute recipe to produce `.github/assets/demo-claude.gif` (the hero
> GIF that replaces the CLI demo on the public launch). Self-contained
> instructions — anyone with a Mac and Claude Desktop can do this.

---

## 1. Prerequisites (5 min)

```bash
# 1.1 The MCP must be installable as a package locally.
cd ~/projects/licinexus-mcp
npm run build  # produces dist/

# 1.2 Quick smoke check
npm run smoke  # 15/15 green

# 1.3 Recording app — pick one:
#     Kap     (free, simple, opinionated): brew install --cask kap
#     CleanShot X (paid, polished):       https://cleanshot.com
#     QuickTime + gifski:                 brew install gifski
```

## 2. Wire Claude Desktop to the local build (5 min)

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "licinexus": {
      "command": "node",
      "args": ["/Users/alex.laespina/projects/licinexus-mcp/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop. In a new chat, type `/` — you should see the
4 prompts from the MCP. If yes, you're good.

## 3. Stage the recording (5 min)

- **Close every other window**, hide your dock, hide notifications
  (`Do Not Disturb`).
- **Maximize Claude Desktop** to ~1280×800 — leaves room without being huge.
- **New conversation** (Cmd+N). Make sure the "MCP servers" indicator is
  green at the bottom.
- **Pin a sample question** ready in your clipboard (so you don't have to
  type during recording — paste with Cmd+V is cleaner on a GIF).
- **Theme**: light or dark, doesn't matter much — but be consistent
  (don't flip mid-recording).

## 4. Recording (5 min)

The script (3 turns, similar to the CLI demo, but in Claude Desktop):

### Turn 1 — Search bids

You paste:
```
Tem editais publicados nos últimos 7 dias com valor acima de 200 mil reais?
Mostra os 3 mais relevantes.
```

Wait for Claude to call `search_licitacoes` and respond.
**Pause 2 seconds** so the GIF doesn't loop too fast.

### Turn 2 — Find usable price-registry agreements

You paste:
```
Tem alguma ata de registro de preço vigente para notebook? Quero saber o
saldo disponível e o órgão gerenciador.
```

Wait for `search_atas_rp` + (likely) `get_ata_rp` chained call.
**Pause 2 seconds**.

### Turn 3 — Supplier check

You paste:
```
Me passa o cadastro completo do CNPJ do Banco do Brasil — CNAE, capital,
sócios.
```

Wait for `get_cnpj_data` to return.
**Pause 2 seconds, then stop recording.**

Total recording time: **~45–60 seconds**. Don't go over 90s.

## 5. Trim & convert to GIF (5 min)

### If you used Kap
1. After recording, Kap shows preview.
2. Trim the start (before you paste the first prompt) and trailing dead air.
3. Export → "GIF" → settings:
   - **FPS: 12** (smaller file, still smooth enough for text)
   - **Quality: medium-high**
   - **Width: 900px** (matches the README `width="900"`)
4. Save as `~/projects/licinexus-mcp/.github/assets/demo-claude.gif`

### If you used CleanShot X
- Recording → "Save as GIF" → settings: 12 fps, 900px wide
- Save to same path

### If you used QuickTime + gifski (manual)
```bash
# After QuickTime save (e.g. ~/Desktop/recording.mov):
gifski -W 900 -r 12 -Q 80 -o ~/projects/licinexus-mcp/.github/assets/demo-claude.gif ~/Desktop/recording.mov
```

## 6. Size check & swap

```bash
ls -lh ~/projects/licinexus-mcp/.github/assets/demo-claude.gif
# Target: under 5MB. Ideal: 1–3MB.
# If over 5MB, re-export at 10 fps or 800px wide.
```

Swap the README hero:

```bash
cd ~/projects/licinexus-mcp
sed -i '' 's|src=".github/assets/demo.gif"|src=".github/assets/demo-claude.gif"|' README.md
# Verify
grep "demo.*\.gif" README.md
```

The current CLI demo (`demo.gif`) stays in the repo as a "tech demo"
fallback — keep it as is.

## 7. Commit

```bash
git add .github/assets/demo-claude.gif README.md
git commit --signoff -m "feat(demo): add Claude Desktop hero GIF for launch"
git push
```

## 8. Quality checklist before launch

- [ ] GIF is < 5MB
- [ ] Loops smoothly (no abrupt cut at end)
- [ ] All 3 turns complete (search bids, atas RP, CNPJ check)
- [ ] You can read the text on a phone screen (zoom out and see)
- [ ] No notifications, no personal info visible (check email previews,
      tab bars, etc.)
- [ ] Claude's "MCP servers connected" indicator is visible at least once
- [ ] You renamed the MCP indicator to "licinexus" (not "default")

---

## Optional: cleaner shoot using a "demo conversation"

If you want zero retries, you can pre-prepare the conversation. Run the
3 prompts in Claude Desktop the day before, copy each successful response,
then on recording day:

1. Paste the question
2. Wait for Claude to "type" the response (or stage from history)
3. The MCP server still gets called (verifiable in logs) — no fakery.

This avoids any chance Claude misroutes the question or BrasilAPI is slow.

## Troubleshooting

**Claude Desktop doesn't see the MCP**
- Check `~/Library/Logs/Claude/mcp.log` (or `mcp-server-*.log`)
- Common causes: wrong path in config, `dist/` not built, Node not in PATH

**Tool call fails mid-recording**
- PNCP intermittent — reshoot. The CI canary catches outages, so a failing
  recording is bad luck, not a regression.

**GIF too large**
- Drop to 10 fps and 800px width. Text remains readable.
- gifski has `-Q 70` for more aggressive compression.

**Cursor / mouse visible in recording**
- Disable in your screen recorder ("Don't show cursor").

---

_Goal: a 1-3MB GIF that, in 60 seconds, makes a stranger think "I want to
try this right now."_

# Contributing to @licinexusbr/mcp

Thanks for considering a contribution! A few rules to keep this project healthy.

## Open an issue first

For any non-trivial change (new tool, new adapter, new dependency, refactor), **please open an issue first** to discuss the approach. Drive-by PRs without discussion may be closed.

Bug fixes for clear bugs (with reproduction steps) can go straight to PR.

## Developer Certificate of Origin (DCO)

We use [DCO](https://developercertificate.org/) instead of a CLA. Every commit must include a `Signed-off-by` line:

```bash
git commit --signoff -m "your message"
# or git commit -s -m "your message"
```

The `Signed-off-by` line certifies that you wrote the code, or otherwise have the right to contribute it under the project's license. The full text is at <https://developercertificate.org/>.

A CI check enforces this on every PR.

## What we accept

✅ **Yes, please:**
- Bug fixes
- New adapters for public Brazilian government APIs (state TCEs, MPs, etc.)
- Improvements to existing tools (better filters, pagination, error messages)
- Documentation, examples, tests
- Performance / caching improvements

❌ **No, thanks:**
- Code that imports from private Licinexus packages (CI blocks this anyway)
- Features that duplicate the Licinexus paid product (matching engine, supplier scoring, price aggregation, AI-generated artifacts) — this MCP intentionally stops at "raw public data"
- Adapters for non-public or paywalled data sources
- Heavy dependencies without strong justification

## Development setup

```bash
git clone https://github.com/Licinexus/licinexus-mcp.git
cd licinexus-mcp
npm install
npm run dev      # run with tsx
npm test         # run vitest
npm run lint     # run eslint
npm run typecheck
```

## Architecture

Before contributing, read [docs/architecture.md](docs/architecture.md). The protection model is non-negotiable — PRs that weaken the boundary between this MCP and the private Licinexus codebase will be rejected.

## Code style

- TypeScript strict mode.
- Prettier for formatting (`npm run format`).
- ESLint must pass (`npm run lint`).
- Use `zod` for schema validation at boundaries.
- Prefer named exports.

## Commit messages

Conventional Commits style is appreciated but not required:

```
feat(pncp): add search_atas_rp tool
fix(cnpj): handle 14-digit CNPJ with leading zeros
docs: clarify scope in README
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Code of Conduct

By participating, you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

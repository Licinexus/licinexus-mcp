# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in `@licinexus/mcp`, please **do not open a public issue**.

Instead, email **licitacao@licinexus.com.br** with:

- A clear description of the vulnerability
- Steps to reproduce
- Affected versions
- Your assessment of impact

We aim to:

- Acknowledge your report within **3 business days**
- Provide an initial assessment within **7 business days**
- Coordinate a fix and disclosure timeline (typically within 90 days)

We follow [responsible disclosure](https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure) practices and will publicly credit reporters (with permission) once a fix is released.

## Scope

In scope:

- Vulnerabilities in `@licinexus/mcp` source code published in this repository.
- Issues that could lead to RCE, data exfiltration, or denial of service in user environments running the MCP locally.

Out of scope:

- Vulnerabilities in upstream APIs (PNCP, BrasilAPI, etc.) — please report those to the respective maintainers.
- Vulnerabilities in dependencies — please report to those projects (we will update via Dependabot).
- The Licinexus paid product (`licinexus.com.br`) — please contact support there directly.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x     | :white_check_mark: (pre-release; latest minor only) |

## Security Best Practices for Users

- Always install from npm (`@licinexus/mcp`) or the official GitHub release — never from forks you don't trust.
- Keep your install up to date (`npm update @licinexus/mcp`).
- This MCP makes outbound HTTPS requests to public Brazilian government APIs. It does not transmit any data to Licinexus servers.

# CLAUDE.md — Agent Instructions for VoltchainHub

This file gives context to AI coding assistants (Claude Code, Cursor, etc.) working on this repository. It is intentionally short and focused on what an outside contributor would need.

For business context, motivation and architecture, read [README.md](./README.md), [VoltchainHub-Whitepaper-v0.1.md](./VoltchainHub-Whitepaper-v0.1.md), and [CONTRIBUTING.md](./CONTRIBUTING.md) first.

## Project shape

| Area | Stack |
|---|---|
| Smart contracts | Solidity + Hardhat + Hardhat Ignition (deploy), in `contracts/` |
| Backend | Node.js + TypeScript + Express + MQTT (Mosquitto), in `backend/` |
| Frontend | (see `frontend/` if present) |
| Tests | Hardhat tests for contracts; Vitest/Jest for backend |
| Target chain | Polygon PoS (Amoy testnet for staging, mainnet for production) |

## Common commands

```bash
# Contracts
cd contracts
npm install
npx hardhat compile
npx hardhat test
npx hardhat ignition deploy ./ignition/modules/<Module>.ts --network amoy

# Backend
cd backend
npm install
docker-compose up -d            # starts Mosquitto MQTT
npm run dev
npm test
```

See `package.json` in each subproject for the full script list.

## Repository conventions

- **License:** Apache 2.0 (see LICENSE).
- **No native token of our own.** The protocol is token-agnostic — never propose adding a "VOLT" / "LUZ" speculative coin. LuzToken (ERC-1155) is **1 token = 1 kWh** of energy, not a currency.
- **Protocol fee:** flat 0.5% (paid by buyer in `VoltMarketplace`). Don't suggest changing this without explicit discussion in an issue.
- **Off-ramp to fiat (PIX)** is delegated to existing providers (Transfero, Ripio, Mercado Bitcoin). Don't bake fiat conversion into the contracts.
- **ANEEL REN 1000** is the Brazilian regulatory framework the project must respect — flag any code change that conflicts with it.

## Quality bar

- Smart contract changes require **passing tests** and ideally a coverage delta close to zero (don't lower coverage). Run `npx hardhat coverage` if proposing nontrivial changes.
- Backend changes: lint clean (`npm run lint`), type-check clean (`npm run typecheck` if defined), tests pass.
- All PRs follow the template in `.github/` and include a one-paragraph **why** in the PR description, not just **what**.

## Testnet vs mainnet

- **Default to Polygon Amoy testnet** for any new deployment instructions or examples.
- **Mainnet deploys are explicitly opt-in** and require double confirmation in any deploy script — see existing scripts for the pattern.

## Things AI assistants should NOT do here

- Do **not** propose merging unrelated PRs, force-pushing to `main`, rebasing other people's commits, or rewriting public history.
- Do **not** add a new token, new chain, new fee, or new revenue stream without it being explicitly requested in an issue.
- Do **not** invent contract addresses, RPC URLs, or API endpoints. If a value isn't in the repo, ask.
- Do **not** include secrets in code or commits. The repo has TruffleHog/dependabot scanning — if a key shows up, the PR is dead.

## Where to ask

- Issues: https://github.com/viniciusvj/voltchainhub/issues
- Discussions: https://github.com/viniciusvj/voltchainhub/discussions
- Security: see SECURITY.md for responsible disclosure.

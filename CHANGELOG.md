# Changelog

All notable changes to VoltchainHub are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows [Semantic Versioning](https://semver.org/) (pre-1.0: minor bumps may contain breaking changes — always check release notes).

## [Unreleased]

### Added
- `docs/arquitetura.md` — overview técnico do projeto, fluxo de dados entre camadas, tabela dos contratos.
- `firmware/README.md`, `hardware/README.md` — roadmap de cada área, estado atual e como contribuir.
- `scripts/check-deployer-balance.ts` — pre-flight para verificar saldo MATIC da wallet de deploy antes do Ignition.
- `ignition/modules/VoltchainCore.ts` — módulo Hardhat Ignition para deploy ordenado de todos os contratos + seed inicial do `TokenRegistry` em Amoy.
- Testes adicionais em `VoltMarketplace`: guard de reentrancy via ERC-20 malicioso, verificação completa da struct `Settlement` no evento `PaymentSettled`, cobertura do `setDefaultPoolFee`.

### Changed
- `.gitignore` — coberturas adicionais confirmadas após audit de secrets (completas: `.env`, `.env.local`, `.claude/`, `LAUNCH_KIT.md`, pastas de referência).

## [0.1.0] — 2026-04-24

### Added

**Core whitepaper e MVP**
- Whitepaper v0.1 (750+ linhas) — arquitetura, tokenomics, roadmap 4 fases, análise ANEEL REN 1000/2021, modelo econômico R$0,90/kWh grid vs R$0,05-0,15/kWh P2P.
- Smart contracts Solidity 0.8.x em `contracts/contracts/`:
  - `LuzToken.sol` (ERC-1155) — 1 token = 1 kWh verificado, tokenId determinístico por (device, slot, source).
  - `DeviceRegistry.sol` — registro on-chain de dispositivos IoT com attestation ECDSA.
  - `EnergyOracle.sol` — verificação de leituras assinadas pelo ESP32.
  - `EnergyVault.sol` — escrow P2P com lock/delivery/release.
- Backend Node.js + TypeScript + Fastify em `backend/` com arquitetura hexagonal (domain/ports/adapters), SQLite, MQTT broker (Mosquitto), Ethers v6 blockchain gateway.
- Frontend Next.js 14 + Wagmi v2 (esqueleto).
- Site estático em `docs/` — landing page + whitepaper visual, servido via GitHub Pages.

**Payment Abstraction Layer (sem token próprio)**
- `VoltMarketplace.sol` — swap-and-settle atômico via Uniswap v3 com fee de 0,5% (hard cap 2%), slippage guard, pausable, role-gated.
- `TokenRegistry.sol` — whitelist governável de ERC-20s aceitos como moeda de pagamento, categorizada (BRL-stable, USD-stable, nativo, outros).
- Backend: `PaymentPreferenceRepository`, `SettlementRouter`, rota `/preferences` (GET/PUT/list).
- Prosumidor escolhe em qual ERC-20 quer receber; o marketplace faz swap atomicamente. **VoltchainHub não emite token próprio** — evita classificação como valor mobiliário pela CVM e dá liberdade ao prosumidor.
- Off-ramp para PIX via parceiros existentes (Transfero, Ripio, Mercado Bitcoin) — protocolo não toca fiat.

**Governança e docs**
- Apache 2.0 License.
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` (Contributor Covenant v2.1), `SECURITY.md`.
- README com badges, TL;DR em inglês, tabela comparativa grid vs P2P, stack completa e roadmap em 4 fases.
- 20 topics no GitHub, GitHub Pages ativo em https://viniciusvj.github.io/voltchainhub/.

**Qualidade**
- Suite Hardhat com **112 testes passing** (LuzToken, DeviceRegistry, EnergyOracle, EnergyVault, TokenRegistry, VoltMarketplace).
- Mocks de teste: `MockERC20.sol`, `MockSwapRouter.sol` com taxa determinística.

**Comunidade**
- 5 issues iniciais com escopo claro: tradução pt→en, testes de cobertura, endpoint de stats, design doc firmware ESP32-S3, parecer ANEEL REN 1000.
- Labels organizadas: `good first issue`, `help wanted`, `docs`, `contracts`, `backend`, `firmware`, `research`.

### Security

- Audit inicial do histórico git: nenhum `.env`, `.pem`, `.key`, private key, mnemonic ou API key commitados. Apenas placeholders literais em `.env.example`.
- `.gitignore` cobre: `node_modules`, `.env*` (exceto `.example`), `dist/`, `build/`, `artifacts/`, `cache/`, `*.pem`, `*.key`, `secrets/`, `.claude/`, `LAUNCH_KIT.md`, 40 pastas de referência clonadas.

---

[Unreleased]: https://github.com/viniciusvj/voltchainhub/compare/v0.1...HEAD
[0.1.0]: https://github.com/viniciusvj/voltchainhub/releases/tag/v0.1

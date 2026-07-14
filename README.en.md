[🇧🇷 Português](./README.md) | 🇬🇧 English

# ⚡ VoltchainHub

**Open protocol for decentralized P2P energy in Brazil**

[![CI](https://github.com/viniciusvj/voltchainhub/actions/workflows/ci.yml/badge.svg)](https://github.com/viniciusvj/voltchainhub/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![Whitepaper](https://img.shields.io/badge/whitepaper-v0.1-orange)](./VoltchainHub-Whitepaper-v0.1.en.md)
[![Status](https://img.shields.io/badge/status-phase%201%20MVP-yellow)](#roadmap)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![Discussions](https://img.shields.io/badge/discussions-open-8A2BE2)](https://github.com/viniciusvj/voltchainhub/discussions)

> *"Energy as a common good, not a monopoly commodity."* (inspired by Nikola Tesla)

---

## What it is

VoltchainHub is an open-source protocol that unifies four layers usually treated in silos:

- 🔌 **Edge IoT**: ESP32-S3 with TrustZone + ECDSA for secure, signed metering
- ⚙️ **Energy management**: OpenEMS + PowerMatcher (European standards adapted to the ANEEL framework)
- 🔗 **Blockchain**: Polygon PoS, LuzToken ERC-1155 (1 token = 1 kWh, transaction cost under USD 0.001)
- 🌐 **Open protocol**: S2 Protocol (IEC 62746-10-3) as a universal abstraction layer

### 💰 Flexible payments (Payment Abstraction Layer)

**VoltchainHub does not issue its own reward token.** The prosumer (prosumidor) chooses the currency they want to be paid in:

- **BRL-stable:** BRZ, BRLA, cBRL, with off-ramp to PIX via Transfero/Ripio/Mercado Bitcoin
- **USD-stable:** USDC, USDT, DAI
- **Native/blue-chip:** MATIC, WETH, WBTC
- **Others:** any ERC-20 whitelisted in the `TokenRegistry` with liquidity of USD 50k/day or more on Uniswap v3 Polygon

The `VoltMarketplace` contract swaps the buyer-side token into the seller's preferred token atomically. Protocol fee: **flat 0.5%** (roughly 10x cheaper than credit cards). No speculative token, no complex tokenomics, no halving; just clean payment infrastructure.

## Why it exists

Brazil will have **20 million solar prosumers by 2030** (ANEEL projection). Today these generators produce surplus energy during the day and are **required** to hand it to the distribution utility (distribuidora) in exchange for credits that **expire in 60 months** and are offset against full retail tariffs. There is no real P2P market, no local dynamic pricing, and no national open-source protocol connecting IoT, blockchain and the Brazilian regulatory framework.

| Status quo | With VoltchainHub |
|---|---|
| Average residential tariff: **R$ 0.90/kWh (~USD 0.18)** | Realistic neighborhood P2P price: **R$ 0.05-0.15/kWh** |
| Credits that expire with no market | Tokenized receipt (LuzToken) + payment in the currency of your choice |
| Prosumer data held by the utility | Readings signed by the device itself |
| Zero interoperability | S2 Protocol + OpenEMS |
| No control over how you get paid | Receive BRZ, USDC, ETH, WBTC or any listed token |

**VoltchainHub is the missing infrastructure.**

## 📄 Documentation

- 📜 [**Whitepaper v0.1**](./VoltchainHub-Whitepaper-v0.1.en.md): architecture, tokenomics, roadmap, regulatory model
- 🏗️ [Technical architecture](./docs/) _(expanding)_
- 🤝 [How to contribute](./CONTRIBUTING.md)
- 🔐 [Security policy](./SECURITY.md)
- 📋 [Code of conduct](./CODE_OF_CONDUCT.md)

## 🧱 Stack

| Layer | Technology |
|--------|-----------|
| Hardware | ESP32-S3 (TrustZone), CT sensor SCT-013, PLC HomePlug AV |
| Edge | OpenEMS (Java 17), PowerMatcher, Docker |
| Protocol | S2 Protocol (Python/Rust), SHIP/EEBus |
| Blockchain | Polygon PoS, Solidity 0.8.x, Hardhat, ERC-1155 |
| Backend | Node.js, Mosquitto (MQTT), PostgreSQL |
| Frontend | Next.js 14, Wagmi v2, TypeScript |

## 🚀 Quickstart (Phase 1 MVP)

> **Note:** the MVP code (contracts/backend/frontend) is under active development. The whitepaper is the canonical reference while the code stabilizes.

```bash
# Clone
git clone https://github.com/viniciusvj/voltchainhub.git
cd voltchainhub

# Smart contracts (Hardhat)
cd contracts
npm install
cp .env.example .env   # edit with your RPC keys
npx hardhat compile
npx hardhat test

# Backend (Node + MQTT)
cd ../backend
npm install
docker compose up -d mosquitto
npm run dev

# Frontend (Next.js)
cd ../frontend
npm install
npm run dev  # http://localhost:3000
```

## 🗺️ Roadmap

| Phase | Timeline | Deliverables |
|------|-------|-------------|
| **Phase 1: Technical MVP** | 30 days | IoT node + OpenEMS backend + contracts on Polygon Amoy testnet |
| **Phase 2: MG pilot** | 90 days | 10 real prosumers in Minas Gerais trading LuzToken |
| **Phase 3: Public protocol** | 180 days | Mainnet, energy DAO, open governance |
| **Phase 4: Scale** | 1 year | 1,000 active nodes in Brazil, WEG/Deye/Growatt integrations |

## 🤝 Contributing

The project is at an early stage, which makes this the **best** moment to join. We need:

- **Firmware** for ESP32-S3 (CT sensor driver, PLC)
- **OpenEMS drivers** for Brazilian inverters (WEG, Fronius, Growatt, Deye)
- **Smart contracts** in Solidity (LuzToken, marketplace, oracle)
- **S2 adapters** for tarifa branca (time-of-use tariff) and REN 1000
- **Frontend** in Next.js (prosumer dashboard, onboarding)
- **Research/Policy**: ANEEL regulatory analysis
- **Pilots**: prosumers in Minas Gerais (hardware covered)

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide.

## 💬 Community

- 💭 [GitHub Discussions](https://github.com/viniciusvj/voltchainhub/discussions): design, questions, proposals
- 🐛 [Issues](https://github.com/viniciusvj/voltchainhub/issues): bugs and well-scoped features
- 🔒 [Security](./SECURITY.md): vulnerabilities (private channel)

## 📜 License

[Apache 2.0](./LICENSE): free to use, modify and distribute, including commercially.

---

<sub>VoltchainHub is an independent project with no affiliation to ANEEL, distribution utilities or manufacturers. It operates within the Brazilian regulatory framework.</sub>

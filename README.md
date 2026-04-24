# ⚡ VoltchainHub

**Protocolo aberto de energia descentralizada P2P para o Brasil**

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![Whitepaper](https://img.shields.io/badge/whitepaper-v0.1-orange)](./VoltchainHub-Whitepaper-v0.1.md)
[![Status](https://img.shields.io/badge/status-phase%201%20MVP-yellow)](#roadmap)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![Discussions](https://img.shields.io/badge/discussions-open-8A2BE2)](https://github.com/viniciusvj/voltchainhub/discussions)

> *"Energia como bem comum, não commodity de monopólio."* — inspirado em Nikola Tesla

---

## 🇬🇧 TL;DR (English)

Brazil will have **20 million solar prosumers by 2030**, but there is no open-source peer-to-peer energy protocol adapted to the national regulatory framework (ANEEL REN 1000). Average grid tariff: **R$ 0.90/kWh (~USD 0.18)**. Realistic P2P price: **R$ 0.05–0.15/kWh**. VoltchainHub combines ESP32-S3 edge metering (with TrustZone + ECDSA), European energy-management standards (OpenEMS, S2 Protocol, PowerMatcher) and Polygon PoS (LuzToken ERC-1155, 1 token = 1 kWh) to make that market actually buildable. Apache 2.0, open firmware, open contracts, open protocol. Read the [whitepaper](./VoltchainHub-Whitepaper-v0.1.md).

---

## 🇧🇷 O que é

VoltchainHub é um protocolo open-source que une quatro camadas geralmente tratadas em silos:

- 🔌 **IoT de borda** — ESP32-S3 com TrustZone + ECDSA para medição segura e assinada
- ⚙️ **Gestão energética** — OpenEMS + PowerMatcher (padrões europeus adaptados ao marco ANEEL)
- 🔗 **Blockchain** — Polygon PoS, LuzToken ERC-1155 (1 token = 1 kWh, custo de transação < US$ 0,001)
- 🌐 **Protocolo aberto** — S2 Protocol (IEC 62746-10-3) como camada de abstração universal

## Por que existe

O Brasil terá **20 milhões de prosumidores solares até 2030** (projeção ANEEL). Hoje, esses geradores produzem excedente durante o dia e são **obrigados** a cedê-lo à distribuidora em troca de créditos que **expiram em 60 meses** e são compensados em tarifas cheias. Não existe mercado P2P real. Não existe precificação dinâmica local. Não existe protocolo nacional open-source que una IoT, blockchain e o marco legal brasileiro.

| Situação atual | Com VoltchainHub |
|---|---|
| Tarifa residencial média: **R$ 0,90/kWh** | Potencial P2P vizinhança: **R$ 0,05–0,15/kWh** |
| Créditos que expiram sem mercado | Tokens transferíveis e auditáveis |
| Dados do prosumidor na distribuidora | Dados assinados pelo próprio dispositivo |
| Zero interoperabilidade | S2 Protocol + OpenEMS |

**VoltchainHub é a infraestrutura que falta.**

## 📄 Documentação

- 📜 [**Whitepaper v0.1**](./VoltchainHub-Whitepaper-v0.1.md) — arquitetura, tokenomics, roadmap, modelo regulatório
- 🏗️ [Arquitetura técnica](./docs/) _(em expansão)_
- 🤝 [Como contribuir](./CONTRIBUTING.md)
- 🔐 [Política de segurança](./SECURITY.md)
- 📋 [Código de conduta](./CODE_OF_CONDUCT.md)

## 🧱 Stack

| Camada | Tecnologia |
|--------|-----------|
| Hardware | ESP32-S3 (TrustZone), CT sensor SCT-013, PLC HomePlug AV |
| Edge | OpenEMS (Java 17), PowerMatcher, Docker |
| Protocolo | S2 Protocol (Python/Rust), SHIP/EEBus |
| Blockchain | Polygon PoS, Solidity 0.8.x, Hardhat, ERC-1155 |
| Backend | Node.js, Mosquitto (MQTT), PostgreSQL |
| Frontend | Next.js 14, Wagmi v2, TypeScript |

## 🚀 Quickstart (Phase 1 MVP)

> **Nota:** o código do MVP (contracts/backend/frontend) está em desenvolvimento ativo. O whitepaper é o material de referência canônico enquanto o código é estabilizado.

```bash
# Clone
git clone https://github.com/viniciusvj/voltchainhub.git
cd voltchainhub

# Smart contracts (Hardhat)
cd contracts
npm install
cp .env.example .env   # edite com suas chaves RPC
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

| Fase | Prazo | Entregáveis |
|------|-------|-------------|
| **Fase 1: MVP técnico** | 30 dias | Nó IoT + backend OpenEMS + contratos testnet Polygon Amoy |
| **Fase 2: Piloto MG** | 90 dias | 10 prosumidores reais em Minas Gerais trocando LuzToken |
| **Fase 3: Protocolo público** | 180 dias | Mainnet, DAO energética, governança aberta |
| **Fase 4: Escala** | 1 ano | 1.000 nós ativos no Brasil, integrações WEG/Deye/Growatt |

## 🤝 Contribuindo

Projeto em fase inicial — é o **melhor** momento para entrar. Precisamos de:

- **Firmware** ESP32-S3 (driver CT sensor, PLC)
- **OpenEMS drivers** para inversores BR (WEG, Fronius, Growatt, Deye)
- **Smart contracts** Solidity (LuzToken, marketplace, oracle)
- **S2 adapters** para tarifa branca e REN 1000
- **Frontend** Next.js (dashboard prosumidor, onboarding)
- **Research/Policy** — análise regulatória ANEEL
- **Pilotos** — prosumidores em Minas Gerais (hardware coberto)

Veja [CONTRIBUTING.md](./CONTRIBUTING.md) para o guia completo.

## 💬 Comunidade

- 💭 [GitHub Discussions](https://github.com/viniciusvj/voltchainhub/discussions) — design, perguntas, propostas
- 🐛 [Issues](https://github.com/viniciusvj/voltchainhub/issues) — bugs e features com escopo claro
- 🔒 [Security](./SECURITY.md) — vulnerabilidades (canal privado)

## 📜 Licença

[Apache 2.0](./LICENSE) — livre para usar, modificar e distribuir, inclusive comercialmente.

---

<sub>VoltchainHub é um projeto independente, sem vínculo com ANEEL, distribuidoras ou fabricantes. Opera dentro do marco regulatório nacional.</sub>

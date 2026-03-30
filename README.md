# ⚡ VoltchainHub

**Protocolo aberto de energia descentralizada P2P para o Brasil**

> *"Energia como bem comum, não commodity de monopólio."* — inspirado em Nikola Tesla

---

## O que é

VoltchainHub é um protocolo open-source que une:

- 🔌 **IoT de borda** — ESP32-S3 com TrustZone + ECDSA para medição segura
- ⚙️ **Gestão energética** — OpenEMS + PowerMatcher (padrões europeus adaptados ao Brasil)
- 🔗 **Blockchain** — Polygon PoS, LuzToken ERC-1155 (1 token = 1 kWh)
- 🌐 **Protocolo aberto** — S2 Protocol como camada de abstração universal

## Por que existe

O Brasil terá **20 milhões de prosumidores solares até 2030** (ANEEL). Hoje eles geram excedente de energia e são obrigados a cedê-la às distribuidoras por créditos que expiram. Não existe mercado P2P. Não existe protocolo open-source nacional.

Tarifa média BR: **R$ 0,90/kWh** → Potencial P2P: **R$ 0,05–0,15/kWh**

VoltchainHub é a infraestrutura que falta.

## Documentação

- 📄 [Whitepaper v0.1](./VoltchainHub-Whitepaper-v0.1.md)
- 🏗️ [Arquitetura](./docs/arquitetura.md) _(em breve)_
- 🔌 [Hardware](./hardware/) _(em breve)_
- 📜 [Contratos](./contracts/) _(em breve)_

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Hardware | ESP32-S3, CT Sensor SCT-013, PLC HomePlug AV |
| Edge | OpenEMS (Java 17), PowerMatcher, Docker |
| Protocolo | S2 Protocol (Python/Rust), SHIP/EEBus |
| Blockchain | Polygon PoS, Solidity 0.8.x, Hardhat |
| Frontend | Next.js 14, Wagmi v2 |

## Roadmap

- **Fase 1 (30 dias):** MVP técnico — nó IoT + backend OpenEMS + contratos testnet
- **Fase 2 (90 dias):** Piloto 10 prosumidores em Minas Gerais
- **Fase 3 (180 dias):** Protocolo público + DAO energética
- **Fase 4 (1 ano):** 1.000 nós ativos no Brasil

## Contribuindo

Projeto em estágio inicial. Contribuições bem-vindas em:
- Firmware ESP32
- Drivers OpenEMS para inversores brasileiros
- Smart contracts (Solidity)
- Frontend dashboard

## Licença

Apache 2.0 — livre para usar, modificar e distribuir.

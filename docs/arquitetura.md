# Arquitetura Técnica — VoltchainHub

Este documento é o complemento executivo do [Whitepaper v0.1](../VoltchainHub-Whitepaper-v0.1.md) para quem quer entender **a estrutura do repositório, como os componentes se comunicam e onde mexer para contribuir**.

---

## 1. Camadas do Protocolo

```
┌─────────────────────────────────────────────────────────────────────┐
│  FRONTEND     Next.js 14 + Wagmi v2                                 │
│               Dashboard do prosumidor, marketplace, onboarding      │
├─────────────────────────────────────────────────────────────────────┤
│  BACKEND      Node 22 + TypeScript + Fastify                        │
│               Arquitetura hexagonal (domain/ports/adapters)         │
│               SQLite + MQTT + Ethers v6                             │
├─────────────────────────────────────────────────────────────────────┤
│  EDGE         OpenEMS (Java 17) + PowerMatcher                      │
│               Agentes de mercado, drivers de inversor               │
├─────────────────────────────────────────────────────────────────────┤
│  PROTOCOLO    S2 (IEC 62746-10-3)                                   │
│               Abstração universal entre dispositivos de energia     │
├─────────────────────────────────────────────────────────────────────┤
│  HARDWARE     ESP32-S3 + TrustZone + ECDSA P-256                    │
│               CT Sensor SCT-013 + PLC HomePlug AV + MQTT/TLS        │
├─────────────────────────────────────────────────────────────────────┤
│  BLOCKCHAIN   Polygon PoS + LuzToken (ERC-1155)                     │
│               Smart contracts: registry, oracle, vault, marketplace │
└─────────────────────────────────────────────────────────────────────┘
```

Cada camada pode ser substituída. Não há lock-in por design — o protocolo define interfaces, não implementações.

---

## 2. Diretórios do Repo

```
voltchainhub/
├── contracts/              Hardhat workspace (Solidity 0.8.x)
│   ├── contracts/          Source (.sol) — LuzToken, EnergyOracle,
│   │   └── mocks/          EnergyVault, DeviceRegistry,
│   │                       TokenRegistry, VoltMarketplace + mocks de teste
│   ├── test/               Suite Hardhat (112 testes)
│   ├── ignition/modules/   Módulos de deploy (VoltchainCore.ts)
│   └── scripts/            check-deployer-balance.ts, verify helpers
│
├── backend/                Node + Fastify
│   └── src/
│       ├── api/            REST routes (Fastify)
│       ├── domain/         Entities, ports, services (puro, sem I/O)
│       ├── infra/          Repositories SQLite, Ethers gateway, MQTT
│       ├── market/         Auctioneer, ProducerAgent, ConsumerAgent
│       ├── mqtt/           Listener + ReadingHandler
│       ├── openems/        Client + Poller para OpenEMS Edge
│       └── oracle/         OracleService + Scheduler
│
├── frontend/               Next.js 14 + Wagmi v2 (esqueleto)
│
├── firmware/               ESP32-S3 firmware (não iniciado — ver issue #4)
│
├── hardware/               Schematic, PCB, BOM (não iniciado)
│
├── docs/                   GitHub Pages source
│   ├── index.html          Landing
│   ├── whitepaper.html     Whitepaper visual
│   └── arquitetura.md      Este documento
│
└── VoltchainHub-Whitepaper-v0.1.md   Whitepaper canônico (Markdown)
```

---

## 3. Contratos On-chain

| Contrato | Tipo | Responsabilidade | Role-gated? |
|---|---|---|---|
| `DeviceRegistry` | Registro | Atesta ESP32-S3 via ECDSA; mantém mapping `deviceId → owner + publicKey` | `REGISTRAR_ROLE` |
| `EnergyOracle` | Oracle | Valida assinatura de leituras; emite `ReadingVerified`; chama `LuzToken.mint` | `ORACLE_ROLE` |
| `LuzToken` | Token (ERC-1155) | Recibo de 1 kWh verificado; tokenId = `keccak256(device, slot, source)` | `MINTER_ROLE`, `BURNER_ROLE` |
| `EnergyVault` | Escrow | Lock de LuzToken + pagamento durante entrega física; release ou dispute | `ARBITER_ROLE` |
| `TokenRegistry` | Config | Whitelist de ERC-20s aceitos como pagamento, 4 categorias | `REGISTRAR_ROLE` |
| `VoltMarketplace` | Settlement | Swap buyer→seller via Uniswap v3; 0.5% fee; slippage guard | `OPERATOR_ROLE`, `FEE_MANAGER_ROLE` |

**Composição:** `EnergyVault` é o único contrato que chama `VoltMarketplace.settle()`. Outros pontos de integração só passam por event listeners off-chain.

---

## 4. Fluxo de Dados — Transação Completa

```
[1] ESP32-S3 mede 10 kWh às 13h00
     └─ Assina com ECDSA (chave em TrustZone, nunca exportada)
     └─ Publica em MQTT: topic voltchain/readings/<deviceId>

[2] Backend (MqttListener → ReadingHandler)
     └─ Valida assinatura off-chain contra DeviceRegistry.publicKey
     └─ Persiste em SQLite
     └─ Envia para OracleService.enqueue()

[3] OracleScheduler (cada 60s)
     └─ Batch de leituras pendentes → EnergyOracle.submitReading()
     └─ On-chain: EnergyOracle valida + emite ReadingVerified
     └─ On-chain: LuzToken.mint(prosumidor, kWh)

[4] PowerMatcher (cada 5 min)
     └─ ProducerAgent publica bid: "10 kWh @ R$0,08"
     └─ ConsumerAgent publica ask: "5 kWh @ até R$0,12"
     └─ Auctioneer clearing → preço equilíbrio R$0,10
     └─ EnergyVault.lock(buyer=B, seller=A, 5 kWh, R$0,10)

[5] Entrega física (5 min)
     └─ Energia flui pela rede de distribuição
     └─ OpenEMS do comprador confirma recebimento

[6] Settlement
     └─ EnergyVault.release()
          ├─ Queima 5 LuzToken do comprador
          └─ Chama VoltMarketplace.settle()
               ├─ Recebe payToken do comprador
               ├─ Retém 0,5% (treasury)
               ├─ SettlementRouter decide:
               │    ├─ Se payToken == receiveToken: direct transfer
               │    └─ Senão: Uniswap v3 exactInputSingle
               └─ Seller recebe em receiveToken escolhido
     └─ Evento TransactionSettled emitido
```

**Tempo total:** ~7 minutos (5 PowerMatcher + 2 blockchain).

---

## 5. Princípios de Design

### Separation of concerns on-chain
Cada contrato faz uma coisa. `EnergyVault` não conhece detalhes de swap; `VoltMarketplace` não conhece energia. A composição é explícita nas interfaces.

### No protocol token
Decisão arquitetural: **VoltchainHub não emite token de recompensa próprio.** LuzToken é recibo de commodity física, não ativo especulativo. Prosumidor recebe em qualquer ERC-20 listado no `TokenRegistry`. Motivação completa na seção 4.5 do whitepaper.

### Fail-closed, não fail-open
- Oracle sem leituras recentes → não mint, não settle
- Slippage acima do tolerado → transação reverte, fundos voltam ao comprador
- Dispositivo não registrado → leitura ignorada

### Hexagonal (backend)
O domain layer (`backend/src/domain/`) não importa nada de `infra/`. Toda I/O (blockchain, DB, MQTT, HTTP) passa por ports. Testes unitários mockam ports, não services inteiros.

### Governança progressiva
- Fase 1–2: multisig Gnosis Safe 3/5 para admin roles
- Fase 3+: DAO via Aragon OSx com token de governança dedicado (não o LuzToken)

---

## 6. Como Contribuir Nesta Arquitetura

- **Adicionar driver OpenEMS** → pacote Java separado importado via bundle
- **Adicionar token ao marketplace** → proposal de governança chamando `TokenRegistry.addToken`
- **Novo tipo de sensor (não CT)** → driver em `firmware/`, adapter S2 em `backend/src/s2/`
- **Substituir Uniswap por outro DEX** → novo `ISwapRouter` implementation, trocar endereço no deploy
- **Novo tipo de escrow (multi-party)** → novo contrato de vault; `VoltMarketplace.settle` permanece igual

Veja [`CONTRIBUTING.md`](../CONTRIBUTING.md) para o fluxo operacional.

---

## 7. Referências

- Whitepaper v0.1 — `../VoltchainHub-Whitepaper-v0.1.md`
- OpenEMS docs — https://openems.io
- S2 Protocol — https://s2standard.org
- PowerMatcher research papers — https://github.com/flexiblepower/powermatcher
- Uniswap v3 — https://docs.uniswap.org/contracts/v3/overview
- ANEEL REN 1000/2021 — https://www.aneel.gov.br/resolucoes-normativas

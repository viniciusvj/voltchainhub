# VoltChainHub Backend

Decentralized P2P energy trading protocol backend — bridges physical energy measurements from IoT devices to on-chain state on Polygon PoS.

## Architecture

The backend follows **hexagonal architecture** (ports & adapters) with four distinct layers:

```
┌─────────────────────────────────────────────────────────────┐
│                        API Layer                            │
│   Fastify REST server (health, devices, readings,           │
│   market, trades, balance)                                  │
├─────────────────────────────────────────────────────────────┤
│                      Domain Layer                           │
│   Entities: Device, Reading, Bid, Trade, MarketSession      │
│   Value Objects: EcdsaSignature, MarketBasis, PriceCurve    │
│   Services: ReadingValidator, AnomalyDetector,              │
│             ClearingEngine                                  │
│   Ports: DeviceRepo, ReadingRepo, TradeRepo,                │
│          MarketSessionRepo, BlockchainGateway, OpenEmsGw    │
├─────────────────────────────────────────────────────────────┤
│                  Infrastructure Layer                       │
│   SQLite repositories, ethers.js blockchain gateway,        │
│   Zod config loader, pino logger                            │
├─────────────────────────────────────────────────────────────┤
│                    Adapter Layer                             │
│   MQTT Listener ← ESP32-S3 devices                          │
│   Oracle Service → EnergyOracle contract                    │
│   Market (PowerMatcher) → EnergyVault escrow                │
│   OpenEMS Poller ← Edge energy management                   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **ESP32-S3 devices** publish signed energy readings via MQTT (`voltchain/+/readings`)
2. **MqttListener** receives payloads, **ReadingHandler** validates:
   - Zod schema validation
   - Device lookup in registry
   - ECDSA P-256 signature verification (`@noble/curves`)
   - Nonce sequencing check
   - Timestamp drift tolerance
   - Anomaly detection (z-score > threshold)
3. Verified readings are persisted to **SQLite** and enqueued for on-chain submission
4. **OracleScheduler** batches readings and submits to the **EnergyOracle** contract, then mints **LuzTokens** (ERC-1155, 1 token = 1 kWh)
5. **Market cycle** (default 5 min):
   - **ProducerAgent** and **ConsumerAgent** build demand arrays from OpenEMS data
   - **Auctioneer** collects bids, **ClearingEngine** finds equilibrium price via PowerMatcher bid aggregation with linear interpolation
   - Matched trades are locked on-chain via **EnergyVault** escrow

## Smart Contracts

| Contract | Purpose |
|----------|---------|
| **LuzToken** (ERC-1155) | 1 token = 1 kWh verified energy. Fee split: 98% seller, 1% treasury, 1% liquidity |
| **DeviceRegistry** | ESP32-S3 device registration with P-256 public key attestation |
| **EnergyOracle** | Bridge readings on-chain; multi-oracle quorum for >100 kWh; 30-min contestation window |
| **EnergyVault** | P2P trade escrow — buyer locks MATIC, seller's LuzTokens held until delivery confirmation |

## Project Structure

```
src/
├── index.ts                     # Entry point — wires all services
├── logger.ts                    # Pino logger factory
├── domain/
│   ├── entities/                # Device, Reading, Bid, Trade, MarketSession
│   ├── value-objects/           # EcdsaSignature, MarketBasis, PriceCurve
│   ├── ports/                   # Repository & gateway interfaces
│   └── services/                # ReadingValidator, AnomalyDetector, ClearingEngine
├── infra/
│   ├── config/env.ts            # Zod-validated environment config
│   ├── db/sqlite.ts             # better-sqlite3 setup + migrations
│   ├── repositories/            # SQLite implementations of domain ports
│   └── blockchain/              # ethers.js v6 contract gateway
├── api/
│   ├── server.ts                # Fastify setup + CORS
│   └── routes/                  # health, devices, readings, market, trades
├── mqtt/
│   ├── schemas/                 # Zod payload schemas
│   ├── MqttListener.ts          # MQTT client lifecycle
│   └── ReadingHandler.ts        # Reading validation pipeline
├── oracle/
│   ├── OracleService.ts         # Buffer + submit readings on-chain
│   └── OracleScheduler.ts       # Periodic batch submission
├── market/
│   ├── MarketAgent.ts           # Abstract agent with demand array builder
│   ├── ProducerAgent.ts         # Supply-side agent
│   ├── ConsumerAgent.ts         # Demand-side agent
│   ├── Auctioneer.ts            # Session lifecycle + trade matching
│   └── MarketScheduler.ts       # Periodic market clearing
└── openems/
    ├── channel-map.ts           # OpenEMS channel ID mapping
    ├── OpenEmsClient.ts         # REST client for OpenEMS edge
    └── OpenEmsPoller.ts         # Periodic polling + W→Wh conversion
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health check |
| GET | `/devices` | List registered devices |
| GET | `/devices/:id` | Device details |
| GET | `/readings` | List readings (query: `deviceId`, `limit`) |
| GET | `/readings/:id` | Reading by ID |
| GET | `/market/price` | Current equilibrium price |
| GET | `/market/sessions` | Market session history |
| GET | `/market/sessions/:id` | Session details |
| GET | `/trades` | Trade history |
| GET | `/trades/:id` | Trade details |
| POST | `/trades` | Create trade + lock escrow |
| GET | `/balance/:addr` | Wallet balance + trade count |

## Quick Start

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env

# Development (hot-reload)
npm run dev

# Production build
npm run build && npm start

# With Docker
docker compose up -d
```

## Configuration

See `.env.example` for all configuration options. Key settings:

- **MQTT_URL** — Broker for device readings (default: `mqtt://localhost:1883`)
- **RPC_URL** — Polygon RPC endpoint
- **ORACLE_PRIVATE_KEY** — Wallet key for oracle transactions
- **MARKET_CYCLE_SECONDS** — Clearing interval (default: 300 = 5 min)
- **ANOMALY_ZSCORE_THRESHOLD** — Z-score cutoff for anomaly detection (default: 3.0)
- **ORACLE_BATCH_INTERVAL_SECONDS** — Buffered reading submission interval (default: 60)

## Tech Stack

- **Runtime:** Node.js 20+, TypeScript (ES2022, NodeNext modules)
- **HTTP:** Fastify 5
- **Blockchain:** ethers.js v6, Polygon PoS
- **MQTT:** mqtt.js 5
- **Database:** better-sqlite3 (WAL mode)
- **Crypto:** @noble/curves (ECDSA P-256 verification)
- **Validation:** Zod
- **Logging:** Pino
- **Testing:** Vitest

## License

Apache-2.0

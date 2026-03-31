# VoltchainHub Smart Contracts

Smart contracts for the VoltchainHub decentralized P2P energy protocol on Polygon PoS.

## Contracts

| Contract | Description |
|---|---|
| **LuzToken** | ERC-1155 multitoken. 1 token = 1 kWh. Mint/burn with 1% treasury + 1% liquidity fee. `tokenId = keccak256(device, slot, sourceType)` |
| **DeviceRegistry** | Register ESP32-S3 devices with ECDSA P-256 public keys. Verify reading signatures. Activate/deactivate devices. |
| **EnergyOracle** | Submit signed energy readings. Multi-oracle quorum for >100 kWh. 30-min contestation window. Anomaly detection. |
| **EnergyVault** | P2P escrow. Buyer locks MATIC, seller's LuzTokens held in escrow. Confirm delivery, settle, dispute, or expire. |

## Setup

```bash
cd contracts
npm install
```

## Compile

```bash
npm run compile
```

## Test

```bash
npm run test
```

## Deploy

### Local (Hardhat node)

```bash
# Terminal 1
npx hardhat node

# Terminal 2
npm run deploy:local
```

### Polygon Mumbai Testnet

1. Copy `.env.example` to `.env` and fill in:
   - `DEPLOYER_PRIVATE_KEY` — deployer wallet private key
   - `MUMBAI_RPC_URL` — Polygon Mumbai RPC URL
   - `POLYGONSCAN_API_KEY` — for contract verification (optional)

2. Fund the deployer wallet with testnet MATIC

3. Deploy:
```bash
npm run deploy:mumbai
```

### Polygon Amoy Testnet

```bash
npm run deploy:amoy
```

## Networks

| Network | Chain ID | RPC |
|---|---|---|
| Hardhat Local | 31337 | http://localhost:8545 |
| Polygon Mumbai | 80001 | https://rpc-mumbai.maticvigil.com |
| Polygon Amoy | 80002 | https://rpc-amoy.polygon.technology |

## Architecture

```
[ESP32-S3] → [OpenEMS Edge] → [EnergyOracle] → [LuzToken.mint()]
                                                        ↓
[Buyer] → [EnergyVault.lockTrade()] → [confirmDelivery()] → [settleTrade()]
```

1. Device registered in **DeviceRegistry** with ECDSA P-256 public key
2. Oracle submits signed reading to **EnergyOracle**
3. After verification + contestation window, **LuzToken** minted to prosumer
4. P2P trade executed through **EnergyVault** escrow

## Security

- OpenZeppelin v5 (AccessControl, ReentrancyGuard, Pausable)
- Role-based access: MINTER, BURNER, ORACLE, ARBITER, REGISTRAR, PAUSER
- Multi-oracle quorum for high-value readings (>100 kWh)
- 30-minute contestation window on all readings
- Anomaly detection based on device reading history

## License

Apache-2.0

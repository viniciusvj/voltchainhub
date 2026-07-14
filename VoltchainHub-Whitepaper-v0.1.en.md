[🇧🇷 Português](./VoltchainHub-Whitepaper-v0.1.md) | 🇬🇧 English

# VoltchainHub | Whitepaper v0.1
*English translation of Whitepaper v0.1. The Portuguese version is the canonical reference.*

## An Open Decentralized Energy Protocol for Brazil

**Version:** 0.1-draft | **Date:** March 2026 | **License:** Apache 2.0  
**Status:** Public draft, open for contribution

---

## Abstract

Brazil is on track to reach 20 million solar prosumers (prosumidores) by 2030, yet it lacks open infrastructure for these producers to trade energy with one another. VoltchainHub is an open-source protocol that combines edge IoT (ESP32-S3), European energy management standards (OpenEMS, S2 Protocol, PowerMatcher) and the Polygon PoS blockchain to create a P2P energy market with transaction costs below $0.001. The LuzToken (ERC-1155) tokenizes kWh as a transferable, traceable and auditable unit of value. The protocol operates within the legal framework of ANEEL REN 1000/2021, Brazil's distributed-generation regulation, and is the first fully open-source national protocol for decentralized energy. The vision is simple: energy as a common good, not a monopoly commodity.

---

## 1. The Problem

### 1.1 Centralized Energy: Inefficiency and Cost

Brazil's electricity model is structurally centralizing. Generation happens in distant power plants, transmission runs over high-voltage lines with average losses of 14.9% (ANEEL, 2024), and distribution is handled by regional concessionaires holding legal monopoly power. The end consumer foots the bill for this entire chain.

The national average residential tariff surpassed **R$ 0.90/kWh** in 2025. Baked into that figure are sector charges (CDE, PROINFA, EER), technical losses, commercial losses (theft, delinquency), maintenance costs of twentieth-century infrastructure, and the distribution utilities' margins. Relative to per-capita income, Brazilians pay one of the highest electricity tariffs in the world.

The model works like a funnel: energy enters at the top (large generators), travels thousands of kilometers, and reaches the end consumer taxed, lossy and expensive. There is no local market mechanism. Neighbors with solar panels cannot sell energy directly to one another.

### 1.2 The Brazilian Prosumer Without Infrastructure

ANEEL REN 1000/2021 established the legal framework for distributed generation in Brazil. By 2025, the country had already surpassed **5 million units** of distributed micro and mini generation, mostly solar photovoltaic. Projections point to 20 million prosumers by 2030.

The Brazilian prosumer invests R$ 15,000-50,000 in a solar system, generates surplus energy during the day, and receives in return **energy credits** at the local distribuidora (distribution utility): credits that expire after 60 months and are offset against full distribution tariffs under the compensação regime (net-metering credit compensation). There is no real market. There is no dynamic pricing. There is no peer-to-peer.

The result: prosumers who could sell energy at **R$ 0.05-0.15/kWh** to neighbors are forced to "hand over" that energy to the distribution utility at zero cost, which then resells it loaded with its entire cost structure.

### 1.3 Technology Gap: European Standards Untapped in Brazil

Europe has solved much of this problem. The **S2** protocol (IEC 62746-10-3) standardizes communication between energy devices and control systems. **OpenEMS** connects more than 50 manufacturers of inverters, batteries and meters. **PowerMatcher** implements real-time multi-agent energy markets.

None of these standards has been adapted to the Brazilian context. There is no national implementation. There is no open-source protocol tying together IoT infrastructure, blockchain, and the ANEEL regulatory framework.

**That is the gap VoltchainHub fills.**

---

## 2. The Vision: Free Light (Luz Livre)

### 2.1 Tesla's Inspiration: Energy as a Common Good

Nikola Tesla devoted his life to a radical idea: energy should be as accessible as air. His Wardenclyffe Tower project was destroyed not by technical failure, but by economic resistance. Because free energy has no owner, no monopoly, no tariff.

VoltchainHub inherits that spirit. Not because we believe in impossible physics, but because we believe the technology of 2026 (blockchain, IoT, open protocols) gives us the tools to build what Tesla imagined: energy infrastructure that serves the people, not the monopoly.

### 2.2 What "Free Energy" Really Means

"Free energy" in the VoltchainHub context is not a violation of thermodynamics. It is **market freedom**:

- **Free to generate:** anyone can install generation and join the protocol
- **Free to sell:** no mandatory intermediary between producer and consumer
- **Free to audit:** all code, all contracts, all transactions are public and verifiable
- **Free of rent-seeking:** the protocol does not extract value, it only facilitates the exchange

The equilibrium price in the VoltchainHub P2P market converges to the real marginal cost of production, close to zero for solar during the day. That is the "free" that matters.

### 2.3 Protocol Principles

1. **Total openness:** Apache 2.0, no mandatory proprietary component
2. **Data sovereignty:** measurements stay on the prosumer's device; the blockchain records only hashes and balances
3. **Composability:** every layer can be replaced; the protocol imposes no lock-in
4. **Network neutrality:** the protocol favors no prosumer, region or installation size
5. **Regulatory compliance:** operates within ANEEL REN 1000, not against it
6. **Progressiveness:** starts simple (tokenized credits), evolves into a fully autonomous market

---

## 3. Technical Architecture

### 3.1 Layer Overview

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND  │  Web Dashboard (React) + Mobile App           │
├─────────────────────────────────────────────────────────────┤
│  BLOCKCHAIN│  Polygon PoS: LuzToken, DeviceRegistry,      │
│            │  EnergyOracle, EnergyVault                    │
├─────────────────────────────────────────────────────────────┤
│  PROTOCOL  │  S2 Protocol (CEM↔RM) + SHIP (TLS over Wi-Fi) │
├─────────────────────────────────────────────────────────────┤
│  EDGE      │  OpenEMS (Java) + PowerMatcher (market agent) │
├─────────────────────────────────────────────────────────────┤
│  HARDWARE  │  ESP32-S3 + PLC HomePlug AV + local WPT       │
└─────────────────────────────────────────────────────────────┘
```

Each layer is independent and replaceable. A prosumer can join the protocol with nothing more than an ESP32-S3 meter connected to the solar inverter via Modbus. Evolving toward WPT and PLC is optional and incremental.

### 3.2 Hardware Layer: ESP32-S3 + PLC + WPT

**ESP32-S3: The Metering Node**

The ESP32-S3 is the heart of the VoltchainHub device. With a dual-core Xtensa LX7 running at 240 MHz, 8MB PSRAM and support for ARM TrustZone through its security extensions, it is the most capable microcontroller in the Espressif family within its cost segment (< $5 USD).

Roles in the protocol:
- Meter reading via **Modbus RTU/TCP** (compatible with 90%+ of Brazilian inverters)
- Cryptographic signing of readings with **ECDSA P-256** using a private key stored in protected memory (eFuse + TrustZone)
- Telemetry publishing via **MQTT over TLS** to the local edge node
- Offline operation capability with a 72h buffer (SPIFFS)

**PLC HomePlug AV: Transmission over the Power Wiring**

HomePlug AV uses the existing electrical wiring itself as the transmission medium, with efficiency of up to **88%** for data/command transmission over the cable. It enables communication between meters without additional network infrastructure, which is especially relevant for condominiums and industrial microgrids.

In the VoltchainHub context, PLC serves as the local communication backbone between microgrid nodes, complementing (not replacing) Wi-Fi/Ethernet where available.

**WPT: Energy Transfer via Resonant Induction**

For short-range environments (< 5m), the protocol supports energy transfer through magnetic resonant coupling, with **72%** efficiency. Primary application: wirelessly charging the microgrid's IoT devices, reducing failure points and maintenance.

### 3.3 Edge Layer: OpenEMS + PowerMatcher

**OpenEMS: Energy Management System**

OpenEMS (Open Energy Management System) is an open-source Java framework originally developed by FENECON GmbH and now maintained by a global community. It is compatible with **50+ manufacturers** of inverters, batteries, meters and controllers (Fronius, SMA, Huawei, BYD, Victron, among others present in the Brazilian market).

In VoltchainHub, OpenEMS runs on the edge node (Raspberry Pi 4 or ARM equivalent) and performs:
- Telemetry collection from all devices in the local microgrid
- Execution of control strategies (battery charge/discharge, surplus dispatch)
- Data exposure via REST API and WebSocket to the PowerMatcher agent
- Interface with the EnergyOracle contract through an oracle service

**PowerMatcher: Multi-Agent Market**

PowerMatcher implements a decentralized market clearing algorithm. Each energy device (generator, battery, flexible load) acts as an **autonomous agent** that publishes supply/demand curves. The concentrator (auctioneer) computes the local equilibrium price every **5 minutes**.

```
Clearing cycle:
  1. Each agent publishes a bid (price × quantity curve)
  2. Auctioneer aggregates bids from all agents
  3. Equilibrium price = supply/demand intersection
  4. Agents receive the dispatch signal
  5. The result is committed to the EnergyVault contract
```

The result: dynamic local pricing that reflects the real availability of energy, with no intermediary.

### 3.4 Protocol Layer: S2 / SHIP

**S2 Protocol (IEC 62746-10-3)**

S2 defines the interface between the **Customer Energy Manager (CEM)**, the system that decides how energy is used, and the **Resource Manager (RM)**, the device that executes. Implemented in Python (reference) and Rust (production) in VoltchainHub.

Supported control models:
- **FRBC** (Fill Rate Based Control): batteries and storage
- **DDBC** (Demand Driven Based Control): flexible loads
- **PEBC** (Power Envelope Based Control): solar generation
- **OMBC** (Operation Mode Based Control): EVs and chargers

**SHIP (Smart Home IP)**

SHIP provides the secure transport layer (TLS 1.3) for local communication between devices. It solves discovery and authentication in residential networks without depending on a central server.

### 3.5 Blockchain Layer: Smart Contracts

**Network:** Polygon PoS  
**Transaction cost:** < $0.001 per operation  
**Finality:** ~2 seconds  
**Framework:** Hardhat + OpenZeppelin v5

**Core contracts:**

| Contract | Role |
|---|---|
| `LuzToken` | ERC-1155 multitoken. Each token ID represents 1 kWh from a specific source/period |
| `DeviceRegistry` | Registration and attestation of ESP32-S3 devices |
| `EnergyOracle` | Receives signed readings from edge nodes and validates them on-chain |
| `EnergyVault` | Escrow for P2P transactions. Locks tokens until delivery is confirmed |

### 3.6 Full Flow Diagram

```
[Solar Panel] → [Inverter] → [ESP32-S3]
                                    │
                              Modbus RTU
                                    │
                              [OpenEMS Edge]
                                    │
                         S2 Protocol / SHIP
                                    │
                          [PowerMatcher Agent]
                                    │
                           5-min market clearing
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                [Buyer]                        [Seller]
                    │                               │
              EnergyVault.lock()           LuzToken.mint()
                    │                               │
              [Energy delivery]           [Confirms delivery]
                    │                               │
              EnergyVault.release()        LuzToken.transfer()
                    │
              [Balance updated on-chain]
```

---

## 4. LuzToken: Economic Model

### 4.1 Tokenomics (ERC-1155)

**Standard:** ERC-1155 (multitoken)  
**Why ERC-1155:** It lets each kWh carry metadata about source (solar/wind/battery), timestamp and generator location. Essential for renewable energy certificates and traceability.

**Supply:** LuzToken has no fixed supply. Tokens are **minted** as energy is measured and verified, and **burned** when energy is consumed. Total supply reflects the verified stock of energy available in the protocol.

**Token distribution per transaction:**
```
100 kWh generated and verified
  └─ 98 kWh → LuzToken to the selling prosumer
  └─  1 kWh → Protocol treasury (1% fee)
  └─  1 kWh → Liquidity pool for grid equalization
```

**Token IDs** are deterministic:
```
tokenId = keccak256(deviceAddress, timestamp_slot, sourceType)
```
This enables efficient queries by source, period and geographic origin.

### 4.2 Lifecycle of an Energy Transaction

```
1. GENERATION
   Prosumer A generates a 10 kWh surplus at 1pm
   → ESP32-S3 meters it, signs with ECDSA
   → OpenEMS sends the signed reading to the EnergyOracle

2. VERIFICATION
   EnergyOracle validates signature + historical consistency
   → If valid: emits ReadingVerified event
   → LuzToken.mint(prosumerA, 9.9 kWh) // 1% fee withheld

3. OFFER
   A's PowerMatcher agent publishes a bid:
   "10 kWh available @ R$0.08/kWh"

4. MATCHING
   PowerMatcher clearing finds buyer B:
   "5 kWh demanded @ up to R$0.12/kWh"
   Equilibrium price: R$0.10/kWh

5. ESCROW
   EnergyVault.lock(buyer=B, seller=A, amount=5, price=0.10)
   A's tokens locked; B's payment tokens locked
   (B pays in whatever token B holds: USDC, BRZ, MATIC, etc.)

6. DELIVERY
   Energy flows physically (the utility grid as carrier)
   After 5 min, B's OpenEMS confirms receipt

7. SETTLEMENT
   EnergyVault.release() → VoltMarketplace.settle()
   → 5 LuzToken transferred A→B (and burned by B)
   → SettlementRouter converts B's payment into A's
     preferred currency (swap via Uniswap v3 if needed)
   → A receives the chosen token (USDC, BRZ, ETH, WBTC…)
   → TransactionSettled event emitted
```

Total cycle time: ~7 minutes (5 min PowerMatcher cycle + ~2 min blockchain)

### 4.3 P2P Pricing via PowerMatcher

The P2P price is set by the local market, not by a rate table. Anchoring references:

| Reference | R$/kWh |
|---|---|
| Distribution utility tariff (buyer's ceiling reference) | ~0.90 |
| Expected P2P price (equilibrium) | 0.05-0.15 |
| Residential solar marginal cost | ~0.02-0.05 |
| Protocol fee | 1% of the transacted value |

The buyer always pays less than the utility tariff. The seller always earns more than the marginal cost. The protocol captures only 1% for sustainability.

### 4.4 Protocol Sustainability (Fees, Treasury)

**Protocol revenue sources:**
- **0.5% marketplace fee** on the financial value of each transaction (charged in stablecoin at settlement)
- Optional: device registration fee (covers on-chain audit cost)

The 0.5% baseline was chosen as roughly 10x lower than a credit card and roughly 3x lower than the average Brazilian card-terminal (maquininha) fee. Rent-seeking is explicitly out of scope: the protocol captures no value beyond what is needed to sustain development and auditing.

**Treasury allocation:**
- 60% → Protocol development and maintenance
- 25% → Grants for open-source contributors
- 15% → Emergency fund (critical bugs, audits)

Starting in **Phase 3**, the treasury is controlled by the DAO. Before that, by a 3/5 multisig.

### 4.5 Payment Abstraction Layer

**VoltchainHub does not issue its own reward token.** Prosumers receive payment in real currency of their choosing, not in a synthetic token whose value depends on the health of the protocol itself.

**Why this decision:**
1. **Reduces regulatory risk:** VoltchainHub does not create a financial asset that the CVM (Brazil's securities regulator) could classify as a security. The LuzToken is a receipt for a physical commodity (kWh); payment is made in third-party cryptoassets.
2. **Prosumer freedom:** those who want to receive BRL-stables (BRZ, BRLA, cBRL) do; those who prefer USD-stables (USDC, USDT, DAI) do; those who want BTC or ETH do. The protocol is currency-neutral.
3. **Simplified adoption:** for a non-crypto prosumer, onboarding is "you receive R$ in your wallet" (via BRZ/BRLA + PIX off-ramp), with no need to understand the tokenomics of a new token.
4. **Composability:** other protocols can integrate VoltchainHub without adopting an internal token incompatible with their own economic model.

**Flexible payment flow:**

```
Buyer pays in X (e.g. BRZ)              Prosumer prefers to receive Y (e.g. USDC)
         │                                                │
         ▼                                                │
┌───────────────────────────────────────────────┐         │
│  VoltMarketplace (Solidity contract)          │         │
│  1. Receives X from the buyer                 │         │
│  2. Withholds 0.5% fee in X → Treasury        │         │
│  3. SettlementRouter picks the route:         │         │
│     - If X == Y: direct transfer              │         │
│     - If X ≠ Y: swap via Uniswap v3 Polygon   │         │
│  4. Transfers Y to the prosumer               │         │
│  5. Emits PaymentSettled event                │         │
└───────────────────────────────────────────────┘         │
                                                          ▼
                                                    Y in the wallet
```

**Typical settlement time:** ~2 minutes (1 Polygon block + swap confirmation).

**Slippage protection:** the buyer sets `maxSlippageBps` (default 50 = 0.5%) on the transaction. If the swap requires more slippage than that, the transaction aborts and funds return to the buyer; execution never happens under conditions unfavorable to the prosumer.

### 4.6 TokenRegistry: Supported Currency List

The whitelist of accepted tokens is controlled by the `TokenRegistry` (a separate, governable contract). Inclusion criteria:

- Minimum daily liquidity on Uniswap v3 Polygon: **USD 50,000**
- Publicly audited contract (Certik, OpenZeppelin, Trail of Bits or equivalent)
- Not on the OFAC sanctions list
- Not a rebase/deflationary token (incompatible with escrow)

**Initial list (Phase 1, Amoy testnet):**

| Category | Tokens |
|---|---|
| BRL-stable | BRZ, BRLA, cBRL (when available) |
| USD-stable | USDC, USDT, DAI |
| Polygon natives | MATIC (native), WETH, WBTC |
| Others | LINK, AAVE (via Uniswap liquidity) |

Adding/removing a token is a governance proposal: 3/5 multisig until Phase 3, DAO vote after Phase 3.

### 4.7 Off-Ramp to Brazilian Reais (BRL)

A prosumer who chooses to receive **BRZ/BRLA/cBRL** can convert to real PIX (Brazil's instant payment system) via off-ramp partners already active in the Polygon ecosystem:

- **Transfero**: BRZ ↔ PIX, no KYC up to R$ 3,000/month, light KYC above that
- **Ripio**: BRLA ↔ PIX, KYC required
- **Mercado Bitcoin**: multiple stables ↔ PIX, KYC required

VoltchainHub **does not operate its own off-ramp**: it integrates existing ones. This fully insulates the protocol from banking/foreign-exchange liability.

---

## 5. Security and Trust

### 5.1 Device Attestation (TrustZone + ECDSA)

The biggest attack vector in a tokenized energy system is **metering fraud**: a device reporting more energy than it generated. VoltchainHub addresses this in multiple layers:

**Layer 1 (Hardware Security):**
- ECDSA P-256 private key generated during provisioning on the ESP32-S3
- Key stored in eFuse (one-time programmable, not readable by software)
- TrustZone isolates signature execution from the main firmware

**Layer 2 (On-Chain Attestation):**
- During registration, the device signs a challenge from the `DeviceRegistry` contract
- The public key is registered on-chain, bound to the owner's address
- Every subsequent reading includes a signature + sequential nonce (prevents replay attacks)

**Layer 3 (Statistical Validation):**
- `EnergyOracle` keeps a per-device reading history
- Anomalies (sudden spikes, impossible patterns) trigger a flag and manual review
- Configurable threshold per installation type (residential vs. industrial)

### 5.2 Oracle Security Model

The `EnergyOracle` is the critical trust point between the physical world and the blockchain. The design follows the principle of **trust minimization**:

- **Multi-oracle:** At least 3 independent oracles must agree before minting tokens above 100 kWh
- **Operator stake:** Oracle operators stake MATIC. Malicious behavior results in slashing
- **Contestation window:** 30 minutes after each reading for any participant with evidence to contest
- **Fallback:** If the primary oracle is offline for > 15 min, the clearing cycle is paused (no loss, no fraud)

### 5.3 Smart Contract Audit Approach

Before mainnet deployment (Phase 2), all contracts go through:

1. **Automated static analysis:** Slither, MythX
2. **Fuzz testing:** Echidna for critical invariants (supply conservation, vault balance)
3. **Peer code review:** at least 2 external reviewers
4. **Professional audit:** at least 1 recognized audit firm before Phase 3
5. **Public bug bounty:** active program starting in Phase 2

All audit results are published in the public repository.

### 5.4 Regulatory: How It Operates Within ANEEL REN 1000

VoltchainHub **does not replace** the distribution utility; it is still required by law. The protocol operates at the **financial settlement** and **usage optimization** layer over compensation credits (net-metering credit compensation).

**Compatibility model:**

```
Prosumer A generates a surplus
  → Injects it into the utility grid (as always, per REN 1000)
  → The distribution utility credits kWh to the account
  → VoltchainHub tokenizes that credit as LuzToken
  → The prosumer can sell LuzToken to neighbors
  → Neighbors use LuzToken to offset their own bills
```

This model operates entirely within the REN 1000 compensation system. It requires no new regulation. It does not bypass the distribution utility: it uses it as transmission infrastructure.

**For direct transactions in isolated microgrids** (condominiums with their own systems, off-grid communities): the protocol can operate in autonomous mode, but this requires specific ANEEL authorization as self-production. VoltchainHub maintains supporting legal documentation for this use case.

---

## 6. Roadmap

### Phase 1: Technical MVP (30 days)
- [ ] ESP32-S3 firmware: Modbus reading + ECDSA signing + MQTT
- [ ] Solidity contracts: LuzToken, DeviceRegistry, EnergyOracle (Polygon Mumbai testnet)
- [ ] OpenEMS adapter: publishing readings to the oracle
- [ ] PowerMatcher: local instance with 2 simulated agents
- [ ] Basic dashboard: LuzToken balance, transaction history
- **Success criterion:** Simulated end-to-end transaction with real hardware

### Phase 2: 10-Prosumer Pilot in MG (90 days)
- [ ] Deployment in 10 households in the Belo Horizonte metropolitan area
- [ ] Integration with 3 inverter models popular in Brazil (Fronius, Growatt, Deye)
- [ ] Contracts on Polygon mainnet with real value
- [ ] Statistical fraud analysis in production
- [ ] Public technical report of results
- **Success criterion:** ≥ 500 kWh traded P2P with latency < 10 min

### Phase 3: Public Protocol + DAO (180 days)
- [ ] Security audit by an external firm
- [ ] Aragon OSx governance deployment
- [ ] Public SDK (TypeScript + Python) for integrators
- [ ] Complete documentation (pt-BR + en)
- [ ] Grants program for contributors
- [ ] SHIP protocol integration for automatic discovery
- **Success criterion:** ≥ 3 independent integrators using the protocol

### Phase 4: 1000 Active Nodes (1 year)
- [ ] 1000+ devices registered on-chain
- [ ] Expansion to 5 Brazilian states
- [ ] Partnership with at least 1 pilot distribution utility
- [ ] Renewable energy certificate market on top of LuzToken
- [ ] Bridge to other energy protocols (Energy Web Chain)
- **Success criterion:** ≥ 100,000 kWh traded monthly on the protocol

---

## 7. Competitive Differentiators

### vs. Centralized Energy

| Dimension | Current Distribution Utility | VoltchainHub P2P |
|---|---|---|
| Price to buyer | R$ 0.90/kWh | R$ 0.05-0.15/kWh |
| Revenue to seller | R$ 0.00 (credit) | R$ 0.05-0.15/kWh |
| Transparency | Opaque | 100% on-chain |
| Settlement latency | 30 days (bill) | ~7 minutes |
| Access | Regional monopoly | Permissionless |

### vs. Other Blockchain Energy Protocols

| Protocol | Country | Open-Source | Brazil-ready | Real P2P | Cost/tx |
|---|---|---|---|---|---|
| **VoltchainHub** | Brazil | ✅ Apache 2.0 | ✅ REN 1000 | ✅ | < $0.001 |
| Power Ledger | Australia | ❌ | ❌ | ✅ | ~$0.01 |
| WePower | Lithuania | ❌ | ❌ | Partial | ~$0.05 |
| Energy Web | USA/Global | Partial | ❌ | ❌ | ~$0.001 |
| Nexo (CPFL) | Brazil | ❌ | ✅ | ❌ | N/A |

VoltchainHub is the only fully open-source protocol built from the ground up for the Brazilian market, with transaction costs below $0.001.

### Why Brazil/LatAm First

1. **Market timing:** 5M+ active prosumers, 20M projected; a 5-year window to become the standard
2. **No local competition:** zero national open-source protocols in this niche
3. **Favorable regulatory framework:** ANEEL REN 1000 is more advanced on distributed generation than many European countries
4. **Solar irradiation:** Brazil has 30-40% higher irradiation than Europe, meaning a lower solar marginal cost
5. **LatAm potential:** Chile, Colombia and Mexico have similar contexts; the model is exportable with minimal adjustments

---

## 8. Governance

### 8.1 Open-Source (Apache 2.0)

All VoltchainHub code is and always will be Apache 2.0:
- ESP32-S3 firmware
- Solidity contracts
- OpenEMS/PowerMatcher adapters
- SDKs and tooling

No core functionality will ever be proprietary. The ecosystem's business model is built on services, support and integration, not on protocol lock-in.

### 8.2 Phase 1: Gnosis Safe 3/5 Multisig

During the early phases (Phases 1 and 2), the treasury and contract upgrades are controlled by a **3-of-5 Gnosis Safe multisig** with public signers known to the community. All treasury transactions are visible on-chain.

Decisions requiring the multisig:
- Deploying new contracts to mainnet
- Changing protocol parameters (fee rate, thresholds)
- Treasury movements above $1,000

### 8.3 Phase 3: DAO with Aragon OSx

In Phase 3, governance migrates to a DAO built on **Aragon OSx** (modular, audited, battle-tested):

- **Governance token:** LuzToken accumulated through protocol participation confers voting rights
- **Quorum:** 10% of the governance supply for regular proposals; 30% for critical upgrades
- **Timelock:** 48h between approval and execution of any contract change
- **Veto:** The founding multisig retains an emergency veto for 12 months post-DAO (automatic sunset)

### 8.4 Contribution and Community

The protocol grows with the community. Ways to contribute:

- **Code:** PRs on GitHub; issues tagged `good-first-issue` for new contributors
- **Hardware:** Test with new inverters/meters and contribute OpenEMS adapters
- **Research:** Market simulations, PowerMatcher algorithm optimization
- **Documentation:** Installation guides, translation, regional use cases
- **Auditing:** Contract review, security analysis, fuzzing

Regular contributors are eligible for grants from the DAO treasury.

---

## 9. Team and Context

VoltchainHub is a personal project started by **Vinicius**, an engineer and developer focused on technological sovereignty, decentralization and social impact. The protocol is born from the conviction that technology should serve people, not monopolies.

The protocol does not belong to a company. It belongs to a vision: technology as an instrument of economic liberation. Today, whoever owns a solar panel is locked into the distribution utility's monopoly. Tomorrow, with VoltchainHub, that prosumer is a sovereign node in a distributed energy network.

**We are looking for:**
- Firmware engineers with ESP32 and energy protocol experience
- Solidity developers focused on security
- OpenEMS/PowerMatcher specialists
- Energy lawyers familiar with ANEEL regulation
- Prosumers willing to join the Phase 2 pilot

If you believe energy is a right, not a privilege for those who can pay R$ 0.90/kWh, **you are already part of this.**

---

## 10. Conclusion

Brazil stands at an energy crossroads. On one side, expensive and inefficient centralized twentieth-century infrastructure. On the other, 5 million prosumers generating clean energy, locked into a system that does not allow direct exchange between neighbors.

VoltchainHub is the missing infrastructure. It is not a startup. It is not a product. It is an **open protocol**: what HTTP is to the web and Bitcoin is to money, VoltchainHub aspires to be for Brazilian distributed energy.

The technology exists. The regulatory framework exists. The market exists. What was missing was someone putting the pieces together, in the open, so that anyone can use, audit and improve it.

That is VoltchainHub's mission.

**The network begins with the first node. Be the first.**

- GitHub: `github.com/viniciusvj/voltchainhub`
- Community: VoltchainHub Discord *(coming soon)*
- For Phase 2 pilots: *(coming soon)*

---

## Appendix A: Smart Contracts (Solidity Interfaces)

```solidity
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

// ============================================================
// LuzToken: ERC-1155 Multitoken
// 1 token = 1 verified kWh
// tokenId encodes: deviceId + timestamp_slot + sourceType
// ============================================================
interface ILuzToken {
    /// @notice Mints verified kWh to a prosumer
    /// @param to Address of the generating prosumer
    /// @param tokenId Hash(deviceId, slot, source)
    /// @param amount Amount in Wh (1 token = 1000 Wh = 1 kWh)
    /// @param data Encoded JSON metadata (optional IPFS hash)
    function mint(
        address to,
        uint256 tokenId,
        uint256 amount,
        bytes calldata data
    ) external;

    /// @notice Burns tokens after confirmed consumption
    function burn(address from, uint256 tokenId, uint256 amount) external;

    /// @notice Returns the kWh balance available for an address
    function balanceOf(address account, uint256 id) external view returns (uint256);

    /// @notice Encodes a tokenId from parameters
    function encodeTokenId(
        address device,
        uint32 slot,      // 5-minute slot since epoch
        uint8 sourceType  // 0=solar, 1=wind, 2=battery, 3=grid
    ) external pure returns (uint256);

    event TokenMinted(address indexed to, uint256 indexed tokenId, uint256 amount);
    event TokenBurned(address indexed from, uint256 indexed tokenId, uint256 amount);
}

// ============================================================
// DeviceRegistry: Device Registration and Attestation
// ============================================================
interface IDeviceRegistry {
    struct Device {
        address owner;         // Prosumer's Ethereum address
        bytes32 publicKeyX;    // X coordinate of the ECDSA P-256 public key
        bytes32 publicKeyY;    // Y coordinate of the ECDSA P-256 public key
        uint64  registeredAt;
        bool    active;
        string  metadata;      // IPFS CID with device specs
    }

    /// @notice Registers a new device with attestation proof
    /// @param deviceId Unique identifier (keccak256 of serial + MAC)
    /// @param pubKeyX X coordinate of the device's public key
    /// @param pubKeyY Y coordinate of the device's public key
    /// @param attestationSig Signature of the registration challenge
    function registerDevice(
        bytes32 deviceId,
        bytes32 pubKeyX,
        bytes32 pubKeyY,
        bytes calldata attestationSig,
        string calldata metadata
    ) external;

    /// @notice Verifies the ECDSA signature of a reading
    function verifyReading(
        bytes32 deviceId,
        bytes32 readingHash,
        bytes calldata signature
    ) external view returns (bool valid);

    /// @notice Deactivates a compromised device (owner or governance)
    function deactivateDevice(bytes32 deviceId, string calldata reason) external;

    function getDevice(bytes32 deviceId) external view returns (Device memory);

    event DeviceRegistered(bytes32 indexed deviceId, address indexed owner);
    event DeviceDeactivated(bytes32 indexed deviceId, string reason);
}

// ============================================================
// EnergyOracle: Bridge between physical metering and blockchain
// ============================================================
interface IEnergyOracle {
    struct Reading {
        bytes32 deviceId;
        uint256 wattHours;     // Measured energy in Wh
        uint64  timestamp;     // Unix timestamp of the reading
        uint32  slot;          // PowerMatcher slot (5 min)
        bytes   signature;     // ECDSA signature from the ESP32-S3
    }

    /// @notice Submits a device-signed reading
    /// @dev Oracle validates signature, consistency, and emits event
    function submitReading(Reading calldata reading) external;

    /// @notice Confirms a reading after oracle quorum (multi-oracle mode)
    function confirmReading(bytes32 readingId, bytes calldata oracleSig) external;

    /// @notice Contests a reading within the 30-min window
    function contestReading(bytes32 readingId, bytes calldata evidence) external;

    event ReadingSubmitted(bytes32 indexed readingId, bytes32 indexed deviceId, uint256 wh);
    event ReadingConfirmed(bytes32 indexed readingId);
    event ReadingContested(bytes32 indexed readingId, address contester);
}

// ============================================================
// EnergyVault: Escrow for P2P transactions
// ============================================================
interface IEnergyVault {
    struct Trade {
        address seller;
        address buyer;
        uint256 tokenId;
        uint256 energyAmount;  // In Wh
        uint256 pricePerKwh;   // In MATIC (18 decimals)
        uint64  deadline;      // Escrow expiration
        TradeStatus status;
    }

    enum TradeStatus { Pending, Locked, Delivered, Settled, Expired, Disputed }

    /// @notice Creates and locks escrow for a P2P trade
    /// @dev Requires LuzToken approval from the seller and MATIC from the buyer
    function lockTrade(
        address seller,
        uint256 tokenId,
        uint256 energyAmount,
        uint256 pricePerKwh,
        uint64 deliveryDeadline
    ) external payable returns (bytes32 tradeId);

    /// @notice Confirms energy delivery (called by the buyer's OpenEMS)
    function confirmDelivery(bytes32 tradeId) external;

    /// @notice Settles the trade after confirmation; transfers tokens and MATIC
    function settleTrade(bytes32 tradeId) external;

    /// @notice Opens a dispute for manual/DAO resolution
    function disputeTrade(bytes32 tradeId, string calldata reason) external;

    /// @notice Expires an unconfirmed trade after the deadline
    function expireTrade(bytes32 tradeId) external;

    function getTrade(bytes32 tradeId) external view returns (Trade memory);

    event TradeLocked(bytes32 indexed tradeId, address seller, address buyer, uint256 amount);
    event TradeSettled(bytes32 indexed tradeId, uint256 energyWh, uint256 valueMatic);
    event TradeDisputed(bytes32 indexed tradeId, string reason);
}
```

---

## Appendix B: Complete Technology Stack

| Layer | Component | Version | License | Link |
|---|---|---|---|---|
| Hardware | ESP32-S3 | ESP-IDF 5.x | Apache 2.0 | espressif.com |
| Hardware | HomePlug AV | N/A | Open spec | homeplug.org |
| Edge | OpenEMS | 2024.x | LGPL 2.1 | openems.io |
| Edge | PowerMatcher | 1.2 | Apache 2.0 | github.com/flexiblepower |
| Protocol | S2 Protocol | 1.0 | Apache 2.0 | s2standard.org |
| Protocol | SHIP | 1.0 | Open spec | eebus.org |
| Blockchain | Polygon PoS | N/A | MIT | polygon.technology |
| Contracts | OpenZeppelin | 5.x | MIT | openzeppelin.com |
| Contracts | Hardhat | 2.x | MIT | hardhat.org |
| Security | Slither | latest | AGPL 3.0 | github.com/crytic |
| Governance | Aragon OSx | 1.3 | GPL 3.0 | aragon.org |
| Governance | Gnosis Safe | 1.4 | LGPL 3.0 | safe.global |
| Frontend | React + Viem | 18.x / 2.x | MIT | react.dev |

**Minimum hardware requirements (full node):**
- Edge Node: Raspberry Pi 4 (4GB RAM) or ARM Cortex-A72 equivalent
- Meter: ESP32-S3-WROOM-1 with an SCT-013 current sensor
- Connectivity: 2.4GHz Wi-Fi or Ethernet (PLC HomePlug AV as an alternative)
- Storage: 32GB microSD (edge node)

---

## Appendix C: References and Base Projects

### Brazilian Regulation
- ANEEL REN 1000/2021: Legal framework for distributed generation
- ANEEL REN 1059/2023: Update covering storage systems
- MME PDE 2031: Ten-Year Energy Expansion Plan (solar projections)

### Technical Standards
- IEC 62746-10-3 (S2 Protocol): Customer Energy Manager interface
- IEEE 1901 (HomePlug AV): Broadband over Power Line
- IEC 61968/61970 (CIM): Common Information Model for energy

### Base Open-Source Projects
- **OpenEMS**: github.com/OpenEMS/openems
- **PowerMatcher**: github.com/flexiblepower/powermatcher
- **S2 Protocol Reference**: github.com/flexiblepower/s2-ws-json
- **Hardhat**: github.com/NomicFoundation/hardhat
- **OpenZeppelin Contracts**: github.com/OpenZeppelin/openzeppelin-contracts

### Reference Projects in the Sector
- **Energy Web Chain**: Dedicated blockchain for the electricity sector (EWF)
- **Power Ledger**: Australian P2P protocol (proprietary)
- **Brooklyn Microgrid**: LO3 Energy case study, New York
- **Pylon Network**: European protocol, Spain

### Papers and Studies
- IRENA (2023): "Peer-to-Peer Electricity Trading: Innovation Landscape Brief"
- ENEA Consulting (2022): "Blockchain for Energy: Beyond the Hype"
- ANEEL (2024): Annual Distributed Generation Report
- Tushar et al. (2020): "Peer-to-Peer Energy Trading in Smart Grid Networks"

---

*VoltchainHub Whitepaper v0.1, March 2026*  
*Apache 2.0 License: free to use, modify and distribute with attribution*  
*"The network begins with the first node."*

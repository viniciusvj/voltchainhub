import { ethers } from 'ethers';
import type { BlockchainGateway } from '../../domain/ports/BlockchainGateway.js';
import type { Reading } from '../../domain/entities/Reading.js';
import type { Env } from '../config/env.js';
import { createLogger } from '../../logger.js';

import EnergyOracleAbi from './abis/EnergyOracle.json' with { type: 'json' };
import LuzTokenAbi from './abis/LuzToken.json' with { type: 'json' };
import EnergyVaultAbi from './abis/EnergyVault.json' with { type: 'json' };
import DeviceRegistryAbi from './abis/DeviceRegistry.json' with { type: 'json' };

const log = createLogger('blockchain');

// Energy source enum on EnergyOracle/LuzToken (0 = solar).
const SOURCE_SOLAR = 0;
// Default LuzToken receipt id used until per-trade token ids are wired through the port.
const LUZ_DEFAULT_TOKEN_ID = 1;

export class EthersBlockchainGateway implements BlockchainGateway {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private oracle: ethers.Contract;
  private luzToken: ethers.Contract;
  private vault: ethers.Contract;
  private deviceRegistry: ethers.Contract;

  constructor(env: Env) {
    this.provider = new ethers.JsonRpcProvider(env.RPC_URL, env.CHAIN_ID);
    this.signer = new ethers.Wallet(env.ORACLE_PRIVATE_KEY || ethers.Wallet.createRandom().privateKey, this.provider);
    this.oracle = new ethers.Contract(env.ENERGY_ORACLE_ADDRESS || ethers.ZeroAddress, EnergyOracleAbi, this.signer);
    this.luzToken = new ethers.Contract(env.LUZ_TOKEN_ADDRESS || ethers.ZeroAddress, LuzTokenAbi, this.signer);
    this.vault = new ethers.Contract(env.ENERGY_VAULT_ADDRESS || ethers.ZeroAddress, EnergyVaultAbi, this.signer);
    this.deviceRegistry = new ethers.Contract(env.DEVICE_REGISTRY_ADDRESS || ethers.ZeroAddress, DeviceRegistryAbi, this.signer);
  }

  async submitReading(reading: Reading): Promise<{ txHash: string }> {
    try {
      // Real signature: submitReading(bytes32 deviceId, uint256 wattHours,
      //   uint64 timestamp, uint32 slot, uint8 sourceType, bytes signature).
      // Slot maps to the reading nonce; sourceType defaults to SOURCE_SOLAR (0);
      // the P-256 signature (r,s) is packed into a single 64-byte blob.
      const signature = ethers.concat([reading.signature.r, reading.signature.s]);
      const tx = await this.oracle.submitReading(
        reading.deviceId,
        ethers.parseUnits(reading.wattsH.toString(), 18),
        reading.timestamp,
        reading.nonce,
        SOURCE_SOLAR,
        signature,
      );
      const receipt = await tx.wait();
      log.info({ txHash: receipt.hash, deviceId: reading.deviceId }, 'Reading submitted on-chain');
      return { txHash: receipt.hash };
    } catch (err) {
      log.error({ err, deviceId: reading.deviceId }, 'Failed to submit reading on-chain');
      throw err;
    }
  }

  async mintTokens(to: string, tokenId: string, amountKWh: number): Promise<{ txHash: string }> {
    try {
      const tx = await this.luzToken.mint(to, tokenId, ethers.parseUnits(amountKWh.toString(), 18), '0x');
      const receipt = await tx.wait();
      log.info({ txHash: receipt.hash, to, amountKWh }, 'LuzTokens minted');
      return { txHash: receipt.hash };
    } catch (err) {
      log.error({ err, to, amountKWh }, 'Failed to mint LuzTokens');
      throw err;
    }
  }

  async lockEscrow(
    buyer: string,
    seller: string,
    amountKWh: number,
    pricePerKWh: number,
    opts?: { tokenId?: number; deadlineSec?: number },
  ): Promise<{ txHash: string; tradeId?: string }> {
    try {
      // lockTrade(address seller, uint256 tokenId, uint256 energyAmount(Wh),
      //   uint256 pricePerKwh(wei), uint64 deliveryDeadline) payable. The vault pulls the
      // seller's LuzTokens (seller must setApprovalForAll) and holds the buyer's MATIC;
      // requiredMatic = energyWh * pricePerKwhWei / 1000 (excess is refunded on-chain).
      //
      // TESTNET-CUSTODIAL PATH: the buyer is msg.sender = this backend signer, so the
      // BACKEND funds the trade with its own POL. This is a demo/testnet convenience,
      // NOT the production model. In production the escrow is BUYER-FUNDED from the
      // buyer's own wallet on the frontend (wagmi lockTrade with value). See
      // docs/design/escrow-flow.md. Do not route real user funds through here.
      const tokenId = opts?.tokenId ?? LUZ_DEFAULT_TOKEN_ID;
      const deadline = opts?.deadlineSec ?? Math.floor(Date.now() / 1000) + 24 * 3600;
      const energyWh = BigInt(Math.round(amountKWh * 1000));
      const pricePerKwhWei = ethers.parseEther(pricePerKWh.toString());
      const requiredMatic = (energyWh * pricePerKwhWei) / 1000n;

      const tx = await this.vault.lockTrade(
        seller,
        tokenId,
        energyWh,
        pricePerKwhWei,
        deadline,
        { value: requiredMatic },
      );
      const receipt = await tx.wait();

      const ev = receipt.logs
        .map((l: ethers.Log) => { try { return this.vault.interface.parseLog(l); } catch { return null; } })
        .find((p: ethers.LogDescription | null) => p?.name === 'TradeLocked');
      const tradeId = ev?.args?.tradeId as string | undefined;

      log.info({ txHash: receipt.hash, buyer, seller, amountKWh, tradeId }, 'Escrow locked');
      return { txHash: receipt.hash, tradeId };
    } catch (err) {
      log.error({ err, buyer, seller }, 'Failed to lock escrow');
      throw err;
    }
  }

  async releaseEscrow(tradeId: string): Promise<{ txHash: string }> {
    try {
      // Real function is settleTrade(bytes32); the vault had no `release`.
      const tx = await this.vault.settleTrade(tradeId);
      const receipt = await tx.wait();
      log.info({ txHash: receipt.hash, tradeId }, 'Escrow released');
      return { txHash: receipt.hash };
    } catch (err) {
      log.error({ err, tradeId }, 'Failed to release escrow');
      throw err;
    }
  }

  async getBalance(address: string): Promise<{ luz: string; matic: string }> {
    const maticBalance = await this.provider.getBalance(address);
    let luzBalance = 0n;
    try {
      luzBalance = await this.luzToken.balanceOf(address, 0);
    } catch {
      // Contract may not be deployed yet
    }
    return {
      luz: ethers.formatUnits(luzBalance, 18),
      matic: ethers.formatEther(maticBalance),
    };
  }

  async getChainStats(): Promise<{ deviceCount: string; luzTotalSupply: string; tradeCount: string }> {
    let deviceCount = 0n;
    let luzTotalSupply = 0n;
    let tradeCount = 0n;
    try {
      deviceCount = await this.deviceRegistry.deviceCount();
    } catch (err) {
      log.warn({ err }, 'getChainStats: deviceCount read failed');
    }
    try {
      luzTotalSupply = await this.luzToken.totalSupplyAll();
    } catch (err) {
      log.warn({ err }, 'getChainStats: luzTotalSupply read failed');
    }
    try {
      tradeCount = await this.vault.tradeCount();
    } catch (err) {
      log.warn({ err }, 'getChainStats: tradeCount read failed');
    }
    return {
      deviceCount: deviceCount.toString(),
      // LuzToken is ERC-1155: amounts are raw integers (1 = 1 kWh receipt), not 18-decimal.
      luzTotalSupply: luzTotalSupply.toString(),
      tradeCount: tradeCount.toString(),
    };
  }
}

import { ethers } from 'ethers';
import type { BlockchainGateway } from '../../domain/ports/BlockchainGateway.js';
import type { Reading } from '../../domain/entities/Reading.js';
import type { Env } from '../config/env.js';
import { createLogger } from '../../logger.js';

import EnergyOracleAbi from './abis/EnergyOracle.json' with { type: 'json' };
import LuzTokenAbi from './abis/LuzToken.json' with { type: 'json' };
import EnergyVaultAbi from './abis/EnergyVault.json' with { type: 'json' };

const log = createLogger('blockchain');

export class EthersBlockchainGateway implements BlockchainGateway {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private oracle: ethers.Contract;
  private luzToken: ethers.Contract;
  private vault: ethers.Contract;

  constructor(env: Env) {
    this.provider = new ethers.JsonRpcProvider(env.RPC_URL, env.CHAIN_ID);
    this.signer = new ethers.Wallet(env.ORACLE_PRIVATE_KEY || ethers.Wallet.createRandom().privateKey, this.provider);
    this.oracle = new ethers.Contract(env.ENERGY_ORACLE_ADDRESS || ethers.ZeroAddress, EnergyOracleAbi, this.signer);
    this.luzToken = new ethers.Contract(env.LUZ_TOKEN_ADDRESS || ethers.ZeroAddress, LuzTokenAbi, this.signer);
    this.vault = new ethers.Contract(env.ENERGY_VAULT_ADDRESS || ethers.ZeroAddress, EnergyVaultAbi, this.signer);
  }

  async submitReading(reading: Reading): Promise<{ txHash: string }> {
    try {
      const tx = await this.oracle.submitReading(
        reading.deviceId,
        ethers.parseUnits(reading.wattsH.toString(), 18),
        reading.timestamp,
        reading.nonce,
        reading.signature.r,
        reading.signature.s,
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

  async lockEscrow(buyer: string, seller: string, amountKWh: number, pricePerKWh: number): Promise<{ txHash: string }> {
    try {
      const tx = await this.vault.lock(
        buyer, seller,
        ethers.parseUnits(amountKWh.toString(), 18),
        ethers.parseUnits(pricePerKWh.toString(), 18),
      );
      const receipt = await tx.wait();
      log.info({ txHash: receipt.hash, buyer, seller, amountKWh }, 'Escrow locked');
      return { txHash: receipt.hash };
    } catch (err) {
      log.error({ err, buyer, seller }, 'Failed to lock escrow');
      throw err;
    }
  }

  async releaseEscrow(tradeId: string): Promise<{ txHash: string }> {
    try {
      const tx = await this.vault.release(tradeId);
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
}

import type { Reading } from '../entities/Reading.js';

export interface BlockchainGateway {
  submitReading(reading: Reading): Promise<{ txHash: string }>;
  mintTokens(to: string, tokenId: string, amountKWh: number): Promise<{ txHash: string }>;
  lockEscrow(buyer: string, seller: string, amountKWh: number, pricePerKWh: number): Promise<{ txHash: string }>;
  releaseEscrow(tradeId: string): Promise<{ txHash: string }>;
  getBalance(address: string): Promise<{ luz: string; matic: string }>;
}

import type { Trade } from '../entities/Trade.js';

export interface TradeRepository {
  save(trade: Trade): void;
  findById(id: string): Trade | null;
  findBySession(sessionId: string): Trade[];
  findByParticipant(address: string, limit?: number): Trade[];
  findRecent(limit: number): Trade[];
  updateStatus(id: string, status: Trade['status'], txHash?: string): void;
}

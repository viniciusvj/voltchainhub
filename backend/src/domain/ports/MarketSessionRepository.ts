import type { MarketSession } from '../entities/MarketSession.js';

export interface MarketSessionRepository {
  save(session: MarketSession): void;
  findById(id: string): MarketSession | null;
  findLatest(): MarketSession | null;
  findByTimeRange(from: number, to: number): MarketSession[];
  update(session: MarketSession): void;
}

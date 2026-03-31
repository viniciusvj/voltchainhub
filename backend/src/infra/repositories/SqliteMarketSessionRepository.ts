import type Database from 'better-sqlite3';
import type { MarketSession } from '../../domain/entities/MarketSession.js';
import type { MarketSessionRepository } from '../../domain/ports/MarketSessionRepository.js';

export class SqliteMarketSessionRepository implements MarketSessionRepository {
  constructor(private db: Database.Database) {}

  save(session: MarketSession): void {
    this.db.prepare(`
      INSERT INTO market_sessions (id, starts_at, ends_at, equilibrium_price, bid_count, trade_count, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(session.id, session.startsAt, session.endsAt, session.equilibriumPrice, session.bidCount, session.tradeCount, session.status);
  }

  findById(id: string): MarketSession | null {
    const row = this.db.prepare('SELECT * FROM market_sessions WHERE id = ?').get(id) as DbRow | undefined;
    return row ? toSession(row) : null;
  }

  findLatest(): MarketSession | null {
    const row = this.db.prepare('SELECT * FROM market_sessions ORDER BY starts_at DESC LIMIT 1').get() as DbRow | undefined;
    return row ? toSession(row) : null;
  }

  findByTimeRange(from: number, to: number): MarketSession[] {
    const rows = this.db.prepare(
      'SELECT * FROM market_sessions WHERE starts_at >= ? AND starts_at <= ? ORDER BY starts_at DESC'
    ).all(from, to) as DbRow[];
    return rows.map(toSession);
  }

  update(session: MarketSession): void {
    this.db.prepare(`
      UPDATE market_sessions SET equilibrium_price = ?, bid_count = ?, trade_count = ?, status = ?
      WHERE id = ?
    `).run(session.equilibriumPrice, session.bidCount, session.tradeCount, session.status, session.id);
  }
}

interface DbRow {
  id: string;
  starts_at: number;
  ends_at: number;
  equilibrium_price: number | null;
  bid_count: number;
  trade_count: number;
  status: string;
}

function toSession(row: DbRow): MarketSession {
  return {
    id: row.id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    equilibriumPrice: row.equilibrium_price,
    bidCount: row.bid_count,
    tradeCount: row.trade_count,
    status: row.status as MarketSession['status'],
  };
}

import type Database from 'better-sqlite3';
import type { Trade } from '../../domain/entities/Trade.js';
import type { TradeRepository } from '../../domain/ports/TradeRepository.js';

export class SqliteTradeRepository implements TradeRepository {
  constructor(private db: Database.Database) {}

  save(trade: Trade): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO trades (id, session_id, seller, buyer, kwh, price_per_kwh, status, tx_hash, created_at, settled_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(trade.id, trade.sessionId, trade.seller, trade.buyer, trade.kWh, trade.pricePerKWh, trade.status, trade.txHash, trade.createdAt, trade.settledAt);
  }

  findById(id: string): Trade | null {
    const row = this.db.prepare('SELECT * FROM trades WHERE id = ?').get(id) as DbRow | undefined;
    return row ? toTrade(row) : null;
  }

  findBySession(sessionId: string): Trade[] {
    const rows = this.db.prepare('SELECT * FROM trades WHERE session_id = ?').all(sessionId) as DbRow[];
    return rows.map(toTrade);
  }

  findByParticipant(address: string, limit = 100): Trade[] {
    const rows = this.db.prepare(
      'SELECT * FROM trades WHERE seller = ? OR buyer = ? ORDER BY created_at DESC LIMIT ?'
    ).all(address, address, limit) as DbRow[];
    return rows.map(toTrade);
  }

  findRecent(limit: number): Trade[] {
    const rows = this.db.prepare('SELECT * FROM trades ORDER BY created_at DESC LIMIT ?').all(limit) as DbRow[];
    return rows.map(toTrade);
  }

  updateStatus(id: string, status: Trade['status'], txHash?: string): void {
    if (txHash) {
      this.db.prepare('UPDATE trades SET status = ?, tx_hash = ?, settled_at = ? WHERE id = ?')
        .run(status, txHash, status === 'settled' ? Date.now() : null, id);
    } else {
      this.db.prepare('UPDATE trades SET status = ? WHERE id = ?').run(status, id);
    }
  }
}

interface DbRow {
  id: string;
  session_id: string;
  seller: string;
  buyer: string;
  kwh: number;
  price_per_kwh: number;
  status: string;
  tx_hash: string | null;
  created_at: number;
  settled_at: number | null;
}

function toTrade(row: DbRow): Trade {
  return {
    id: row.id,
    sessionId: row.session_id,
    seller: row.seller,
    buyer: row.buyer,
    kWh: row.kwh,
    pricePerKWh: row.price_per_kwh,
    status: row.status as Trade['status'],
    txHash: row.tx_hash,
    createdAt: row.created_at,
    settledAt: row.settled_at,
  };
}

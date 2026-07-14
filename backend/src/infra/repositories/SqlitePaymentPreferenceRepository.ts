import type Database from 'better-sqlite3';
import type { PaymentPreference, TokenCategory } from '../../domain/entities/PaymentPreference.js';
import type { PaymentPreferenceRepository, PreferenceStats } from '../../domain/ports/PaymentPreferenceRepository.js';

const TOP_TOKENS_LIMIT = 10;

export class SqlitePaymentPreferenceRepository implements PaymentPreferenceRepository {
  constructor(private db: Database.Database) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS payment_preferences (
        owner_address TEXT PRIMARY KEY,
        receive_token_address TEXT NOT NULL,
        receive_token_symbol TEXT NOT NULL,
        category TEXT NOT NULL,
        max_slippage_bps INTEGER NOT NULL DEFAULT 50,
        updated_at INTEGER NOT NULL
      );
    `);
  }

  upsert(pref: PaymentPreference): void {
    this.db.prepare(`
      INSERT INTO payment_preferences
        (owner_address, receive_token_address, receive_token_symbol, category, max_slippage_bps, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(owner_address) DO UPDATE SET
        receive_token_address = excluded.receive_token_address,
        receive_token_symbol  = excluded.receive_token_symbol,
        category              = excluded.category,
        max_slippage_bps      = excluded.max_slippage_bps,
        updated_at            = excluded.updated_at;
    `).run(
      pref.ownerAddress,
      pref.receiveTokenAddress,
      pref.receiveTokenSymbol,
      pref.category,
      pref.maxSlippageBps,
      pref.updatedAt,
    );
  }

  findByOwner(ownerAddress: string): PaymentPreference | null {
    const row = this.db
      .prepare('SELECT * FROM payment_preferences WHERE owner_address = ?')
      .get(ownerAddress.toLowerCase()) as DbRow | undefined;
    return row ? toPref(row) : null;
  }

  listAll(): PaymentPreference[] {
    const rows = this.db
      .prepare('SELECT * FROM payment_preferences ORDER BY updated_at DESC')
      .all() as DbRow[];
    return rows.map(toPref);
  }

  getStats(): PreferenceStats {
    const totals = this.db
      .prepare('SELECT COUNT(*) AS total, COALESCE(AVG(max_slippage_bps), 0) AS avg_slippage FROM payment_preferences')
      .get() as { total: number; avg_slippage: number };

    const byCategory: Record<TokenCategory, number> = {
      BRL_STABLE: 0,
      USD_STABLE: 0,
      NATIVE_WRAPPED: 0,
      OTHER: 0,
    };
    const categoryRows = this.db
      .prepare('SELECT category, COUNT(*) AS count FROM payment_preferences GROUP BY category')
      .all() as Array<{ category: string; count: number }>;
    for (const row of categoryRows) {
      if (row.category in byCategory) byCategory[row.category as TokenCategory] = row.count;
    }

    const topTokens = this.db
      .prepare(`
        SELECT receive_token_symbol AS symbol, COUNT(*) AS count
        FROM payment_preferences
        GROUP BY receive_token_symbol
        ORDER BY count DESC, symbol ASC
        LIMIT ?
      `)
      .all(TOP_TOKENS_LIMIT) as Array<{ symbol: string; count: number }>;

    return {
      totalPreferencesSet: totals.total,
      byCategory,
      topTokens,
      averageMaxSlippageBps: Math.round(totals.avg_slippage),
    };
  }
}

interface DbRow {
  owner_address: string;
  receive_token_address: string;
  receive_token_symbol: string;
  category: string;
  max_slippage_bps: number;
  updated_at: number;
}

function toPref(row: DbRow): PaymentPreference {
  return {
    ownerAddress: row.owner_address,
    receiveTokenAddress: row.receive_token_address,
    receiveTokenSymbol: row.receive_token_symbol,
    category: row.category as TokenCategory,
    maxSlippageBps: row.max_slippage_bps,
    updatedAt: row.updated_at,
  };
}

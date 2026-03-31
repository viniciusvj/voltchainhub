import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

let db: Database.Database | null = null;

export function getDb(dbPath: string): Database.Database {
  if (db) return db;

  mkdirSync(dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations(db);
  return db;
}

function runMigrations(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      public_key_hex TEXT NOT NULL UNIQUE,
      owner TEXT NOT NULL,
      rated_capacity_wh REAL NOT NULL DEFAULT 5000,
      device_type TEXT NOT NULL DEFAULT 'solar',
      status TEXT NOT NULL DEFAULT 'active',
      registered_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS readings (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      watts_h REAL NOT NULL,
      timestamp INTEGER NOT NULL,
      nonce INTEGER NOT NULL,
      signature_r TEXT NOT NULL,
      signature_s TEXT NOT NULL,
      verified INTEGER NOT NULL DEFAULT 0,
      anomaly_flags TEXT NOT NULL DEFAULT '[]',
      received_at INTEGER NOT NULL,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE INDEX IF NOT EXISTS idx_readings_device ON readings(device_id, timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_readings_received ON readings(received_at DESC);

    CREATE TABLE IF NOT EXISTS market_sessions (
      id TEXT PRIMARY KEY,
      starts_at INTEGER NOT NULL,
      ends_at INTEGER NOT NULL,
      equilibrium_price REAL,
      bid_count INTEGER NOT NULL DEFAULT 0,
      trade_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'collecting'
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_time ON market_sessions(starts_at DESC);

    CREATE TABLE IF NOT EXISTS trades (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      seller TEXT NOT NULL,
      buyer TEXT NOT NULL,
      kwh REAL NOT NULL,
      price_per_kwh REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      tx_hash TEXT,
      created_at INTEGER NOT NULL,
      settled_at INTEGER,
      FOREIGN KEY (session_id) REFERENCES market_sessions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_trades_session ON trades(session_id);
    CREATE INDEX IF NOT EXISTS idx_trades_participant ON trades(seller);
    CREATE INDEX IF NOT EXISTS idx_trades_buyer ON trades(buyer);
  `);
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

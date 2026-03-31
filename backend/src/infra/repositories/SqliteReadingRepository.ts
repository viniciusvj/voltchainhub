import type Database from 'better-sqlite3';
import type { Reading } from '../../domain/entities/Reading.js';
import type { ReadingRepository } from '../../domain/ports/ReadingRepository.js';

export class SqliteReadingRepository implements ReadingRepository {
  constructor(private db: Database.Database) {}

  save(reading: Reading): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO readings (id, device_id, watts_h, timestamp, nonce, signature_r, signature_s, verified, anomaly_flags, received_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reading.id, reading.deviceId, reading.wattsH, reading.timestamp,
      reading.nonce, reading.signature.r, reading.signature.s,
      reading.verified ? 1 : 0, JSON.stringify(reading.anomalyFlags), reading.receivedAt,
    );
  }

  findById(id: string): Reading | null {
    const row = this.db.prepare('SELECT * FROM readings WHERE id = ?').get(id) as DbRow | undefined;
    return row ? toReading(row) : null;
  }

  findByDevice(deviceId: string, limit = 100): Reading[] {
    const rows = this.db.prepare(
      'SELECT * FROM readings WHERE device_id = ? ORDER BY timestamp DESC LIMIT ?'
    ).all(deviceId, limit) as DbRow[];
    return rows.map(toReading);
  }

  findRecent(limit: number): Reading[] {
    const rows = this.db.prepare(
      'SELECT * FROM readings ORDER BY received_at DESC LIMIT ?'
    ).all(limit) as DbRow[];
    return rows.map(toReading);
  }

  getLastNonce(deviceId: string): number | null {
    const row = this.db.prepare(
      'SELECT MAX(nonce) as last_nonce FROM readings WHERE device_id = ?'
    ).get(deviceId) as { last_nonce: number | null } | undefined;
    return row?.last_nonce ?? null;
  }

  getStatsForDevice(deviceId: string, windowSize: number): { mean: number; stddev: number; count: number } | null {
    const row = this.db.prepare(`
      SELECT AVG(watts_h) as mean, COUNT(*) as count,
        CASE WHEN COUNT(*) > 1
          THEN SQRT(SUM((watts_h - (SELECT AVG(watts_h) FROM readings WHERE device_id = ?)) * (watts_h - (SELECT AVG(watts_h) FROM readings WHERE device_id = ?))) / (COUNT(*) - 1))
          ELSE 0
        END as stddev
      FROM (SELECT watts_h FROM readings WHERE device_id = ? ORDER BY timestamp DESC LIMIT ?)
    `).get(deviceId, deviceId, deviceId, windowSize) as { mean: number | null; stddev: number; count: number } | undefined;

    if (!row || row.mean === null || row.count === 0) return null;
    return { mean: row.mean, stddev: row.stddev, count: row.count };
  }
}

interface DbRow {
  id: string;
  device_id: string;
  watts_h: number;
  timestamp: number;
  nonce: number;
  signature_r: string;
  signature_s: string;
  verified: number;
  anomaly_flags: string;
  received_at: number;
}

function toReading(row: DbRow): Reading {
  return {
    id: row.id,
    deviceId: row.device_id,
    wattsH: row.watts_h,
    timestamp: row.timestamp,
    nonce: row.nonce,
    signature: { r: row.signature_r, s: row.signature_s },
    verified: row.verified === 1,
    anomalyFlags: JSON.parse(row.anomaly_flags),
    receivedAt: row.received_at,
  };
}

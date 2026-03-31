import type Database from 'better-sqlite3';
import type { Device } from '../../domain/entities/Device.js';
import type { DeviceRepository } from '../../domain/ports/DeviceRepository.js';

export class SqliteDeviceRepository implements DeviceRepository {
  constructor(private db: Database.Database) {}

  save(device: Device): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO devices (id, public_key_hex, owner, rated_capacity_wh, device_type, status, registered_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(device.id, device.publicKeyHex, device.owner, device.ratedCapacityWh, device.deviceType, device.status, device.registeredAt);
  }

  findById(id: string): Device | null {
    const row = this.db.prepare('SELECT * FROM devices WHERE id = ?').get(id) as DbRow | undefined;
    return row ? toDevice(row) : null;
  }

  findByOwner(owner: string): Device[] {
    const rows = this.db.prepare('SELECT * FROM devices WHERE owner = ?').all(owner) as DbRow[];
    return rows.map(toDevice);
  }

  findByPublicKey(publicKeyHex: string): Device | null {
    const row = this.db.prepare('SELECT * FROM devices WHERE public_key_hex = ?').get(publicKeyHex) as DbRow | undefined;
    return row ? toDevice(row) : null;
  }

  findAll(): Device[] {
    const rows = this.db.prepare('SELECT * FROM devices ORDER BY registered_at DESC').all() as DbRow[];
    return rows.map(toDevice);
  }
}

interface DbRow {
  id: string;
  public_key_hex: string;
  owner: string;
  rated_capacity_wh: number;
  device_type: string;
  status: string;
  registered_at: number;
}

function toDevice(row: DbRow): Device {
  return {
    id: row.id,
    publicKeyHex: row.public_key_hex,
    owner: row.owner,
    ratedCapacityWh: row.rated_capacity_wh,
    deviceType: row.device_type as Device['deviceType'],
    status: row.status as Device['status'],
    registeredAt: row.registered_at,
  };
}

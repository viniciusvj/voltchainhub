// ── Trade status ──────────────────────────────────────────────────────────────

export enum TradeStatus {
  Pending   = 'Pending',
  Locked    = 'Locked',
  Delivered = 'Delivered',
  Settled   = 'Settled',
  Expired   = 'Expired',
  Disputed  = 'Disputed',
}

// ── Core domain types ─────────────────────────────────────────────────────────

export interface DeviceMetadata {
  location: string;
  model:    string;
  /** Installed capacity in watts */
  capacity: number;
}

export interface Device {
  id:           string;
  owner:        `0x${string}`;
  publicKey:    { x: string; y: string };
  registeredAt: number; // Unix timestamp (seconds)
  active:       boolean;
  metadata:     DeviceMetadata;
}

export interface EnergyReading {
  deviceId:  string;
  wattHours: number;
  timestamp: number; // Unix timestamp (seconds)
  slot:      number;
  verified:  boolean;
}

export interface Trade {
  id:           string;
  seller:       `0x${string}`;
  buyer:        `0x${string}`;
  tokenId:      bigint;
  energyAmount: number; // Wh
  pricePerKwh:  number; // in BRL cents or smallest unit
  deadline:     number; // Unix timestamp (seconds)
  status:       TradeStatus;
}

// ── Market / order-book types ─────────────────────────────────────────────────

export interface OrderBookEntry {
  price:   number;
  amount:  number; // Wh
  side:    'buy' | 'sell';
  address: `0x${string}`;
}

export interface MarketClearing {
  timestamp: number; // Unix timestamp (seconds)
  price:     number;
  volume:    number; // Wh
  slot:      number;
}

// ── Network / stats types ─────────────────────────────────────────────────────

export interface NetworkStats {
  totalDevices:      number;
  totalEnergyTraded: number; // Wh
  activeEscrows:     number;
  averagePrice:      number;
  totalProsumidores: number;
}

// ── Device health ─────────────────────────────────────────────────────────────

export interface DeviceHealth {
  deviceId:       string;
  lastSeen:       number; // Unix timestamp (seconds)
  signalStrength: number; // 0–100
  batteryLevel:   number; // 0–100, -1 if not applicable
  firmware:       string;
}

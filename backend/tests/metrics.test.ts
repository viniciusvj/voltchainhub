import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import Database from 'better-sqlite3';
import { SqlitePaymentPreferenceRepository } from '../src/infra/repositories/SqlitePaymentPreferenceRepository.js';
import { SqliteDeviceRepository } from '../src/infra/repositories/SqliteDeviceRepository.js';
import { registerMetricsRoutes } from '../src/api/routes/metrics.js';
import type { BlockchainGateway } from '../src/domain/ports/BlockchainGateway.js';

const DEVICES_DDL = `CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  public_key_hex TEXT NOT NULL UNIQUE,
  owner TEXT NOT NULL,
  rated_capacity_wh REAL NOT NULL DEFAULT 5000,
  device_type TEXT NOT NULL DEFAULT 'solar',
  status TEXT NOT NULL DEFAULT 'active',
  registered_at INTEGER NOT NULL
);`;

const fakeChain: BlockchainGateway = {
  submitReading: async () => ({ txHash: '0x' }),
  mintTokens: async () => ({ txHash: '0x' }),
  lockEscrow: async () => ({ txHash: '0x' }),
  releaseEscrow: async () => ({ txHash: '0x' }),
  getBalance: async () => ({ luz: '0', matic: '0' }),
  getChainStats: async () => ({ deviceCount: '7', luzTotalSupply: '1000.0', tradeCount: '2' }),
};

describe('GET /metrics', () => {
  let db: Database.Database;
  let app: FastifyInstance;

  beforeEach(async () => {
    db = new Database(':memory:');
    db.exec(DEVICES_DDL);
    const prefRepo = new SqlitePaymentPreferenceRepository(db);
    const deviceRepo = new SqliteDeviceRepository(db);
    prefRepo.upsert({
      ownerAddress: '0x' + '1'.repeat(40),
      receiveTokenAddress: '0x' + 'a'.repeat(40),
      receiveTokenSymbol: 'BRZ',
      category: 'BRL_STABLE',
      maxSlippageBps: 50,
      updatedAt: Date.now(),
    });
    app = Fastify();
    registerMetricsRoutes(app, deviceRepo, prefRepo, fakeChain);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns local counters and on-chain stats', async () => {
    const res = await app.inject({ method: 'GET', url: '/metrics' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
    expect(body.local.preferencesSet).toBe(1);
    expect(body.local.preferencesByCategory.BRL_STABLE).toBe(1);
    expect(body.chain).toEqual({ deviceCount: '7', luzTotalSupply: '1000.0', tradeCount: '2' });
  });

  it('still returns local metrics when the chain read throws', async () => {
    const brokenChain = { ...fakeChain, getChainStats: async () => { throw new Error('rpc down'); } };
    const app2 = Fastify();
    const db2 = new Database(':memory:');
    db2.exec(DEVICES_DDL);
    registerMetricsRoutes(app2, new SqliteDeviceRepository(db2), new SqlitePaymentPreferenceRepository(db2), brokenChain);
    await app2.ready();
    const res = await app2.inject({ method: 'GET', url: '/metrics' });
    expect(res.statusCode).toBe(200);
    expect(res.json().chain).toEqual({ error: 'rpc down' });
    await app2.close();
    db2.close();
  });
});

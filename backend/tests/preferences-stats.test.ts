import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import Database from 'better-sqlite3';
import { SqlitePaymentPreferenceRepository } from '../src/infra/repositories/SqlitePaymentPreferenceRepository.js';
import { registerPreferenceRoutes } from '../src/api/routes/preferences.js';
import type { PaymentPreference } from '../src/domain/entities/PaymentPreference.js';

function pref(overrides: Partial<PaymentPreference>): PaymentPreference {
  return {
    ownerAddress: '0x' + '1'.repeat(40),
    receiveTokenAddress: '0x' + 'a'.repeat(40),
    receiveTokenSymbol: 'BRZ',
    category: 'BRL_STABLE',
    maxSlippageBps: 50,
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe('GET /preferences/stats', () => {
  let db: Database.Database;
  let repo: SqlitePaymentPreferenceRepository;
  let app: FastifyInstance;

  beforeEach(async () => {
    db = new Database(':memory:');
    repo = new SqlitePaymentPreferenceRepository(db);
    app = Fastify();
    registerPreferenceRoutes(app, repo);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns zeroed stats on empty database', async () => {
    const res = await app.inject({ method: 'GET', url: '/preferences/stats' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toEqual({
      totalPreferencesSet: 0,
      byCategory: {
        BRL_STABLE: 0,
        USD_STABLE: 0,
        NATIVE_WRAPPED: 0,
        OTHER: 0,
      },
      topTokens: [],
      averageMaxSlippageBps: 0,
    });
  });

  it('aggregates counts by category and token with average slippage', async () => {
    repo.upsert(pref({ ownerAddress: '0x' + '1'.repeat(40), receiveTokenSymbol: 'BRZ', category: 'BRL_STABLE', maxSlippageBps: 40 }));
    repo.upsert(pref({ ownerAddress: '0x' + '2'.repeat(40), receiveTokenSymbol: 'BRZ', category: 'BRL_STABLE', maxSlippageBps: 60 }));
    repo.upsert(pref({ ownerAddress: '0x' + '3'.repeat(40), receiveTokenSymbol: 'USDC', category: 'USD_STABLE', maxSlippageBps: 50 }));
    repo.upsert(pref({ ownerAddress: '0x' + '4'.repeat(40), receiveTokenSymbol: 'MATIC', category: 'NATIVE_WRAPPED', maxSlippageBps: 100 }));
    repo.upsert(pref({ ownerAddress: '0x' + '5'.repeat(40), receiveTokenSymbol: 'BRLA', category: 'BRL_STABLE', maxSlippageBps: 10 }));

    const res = await app.inject({ method: 'GET', url: '/preferences/stats' });
    expect(res.statusCode).toBe(200);
    const body = res.json();

    expect(body.totalPreferencesSet).toBe(5);
    expect(body.byCategory).toEqual({
      BRL_STABLE: 3,
      USD_STABLE: 1,
      NATIVE_WRAPPED: 1,
      OTHER: 0,
    });
    expect(body.topTokens[0]).toEqual({ symbol: 'BRZ', count: 2 });
    expect(body.topTokens).toHaveLength(4);
    const symbols = body.topTokens.map((t: { symbol: string }) => t.symbol);
    expect(symbols).toContain('USDC');
    expect(symbols).toContain('MATIC');
    expect(symbols).toContain('BRLA');
    expect(body.averageMaxSlippageBps).toBe(52);
  });

  it('upsert does not double count the same owner', async () => {
    repo.upsert(pref({ ownerAddress: '0x' + '9'.repeat(40), receiveTokenSymbol: 'USDT', category: 'USD_STABLE' }));
    repo.upsert(pref({ ownerAddress: '0x' + '9'.repeat(40), receiveTokenSymbol: 'DAI', category: 'USD_STABLE' }));

    const res = await app.inject({ method: 'GET', url: '/preferences/stats' });
    const body = res.json();
    expect(body.totalPreferencesSet).toBe(1);
    expect(body.topTokens).toEqual([{ symbol: 'DAI', count: 1 }]);
  });

  it('stats route is not shadowed by /preferences/:ownerAddress', async () => {
    const res = await app.inject({ method: 'GET', url: '/preferences/stats' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).not.toHaveProperty('error');
  });
});

import type { FastifyInstance } from 'fastify';
import type { DeviceRepository } from '../../domain/ports/DeviceRepository.js';
import type { PaymentPreferenceRepository } from '../../domain/ports/PaymentPreferenceRepository.js';
import type { BlockchainGateway } from '../../domain/ports/BlockchainGateway.js';

/**
 * GET /metrics: lightweight observability snapshot combining local DB counters
 * with on-chain reads (device count, LuzToken total supply). On-chain reads are
 * best-effort: if the RPC is unreachable the chain block reports the error and
 * local metrics still return.
 */
export function registerMetricsRoutes(
  app: FastifyInstance,
  deviceRepo: DeviceRepository,
  preferenceRepo: PaymentPreferenceRepository,
  blockchain: BlockchainGateway,
): void {
  app.get('/metrics', async () => {
    const prefs = preferenceRepo.getStats();
    const local = {
      devices: deviceRepo.findAll().length,
      preferencesSet: prefs.totalPreferencesSet,
      preferencesByCategory: prefs.byCategory,
    };

    let chain: { deviceCount: string; luzTotalSupply: string } | { error: string };
    try {
      chain = await blockchain.getChainStats();
    } catch (err) {
      chain = { error: err instanceof Error ? err.message : 'chain read failed' };
    }

    return {
      status: 'ok',
      timestamp: Date.now(),
      uptime: process.uptime(),
      local,
      chain,
    };
  });
}

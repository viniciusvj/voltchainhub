import Fastify from 'fastify';
import cors from '@fastify/cors';
import type { DeviceRepository } from '../domain/ports/DeviceRepository.js';
import type { ReadingRepository } from '../domain/ports/ReadingRepository.js';
import type { TradeRepository } from '../domain/ports/TradeRepository.js';
import type { MarketSessionRepository } from '../domain/ports/MarketSessionRepository.js';
import type { PaymentPreferenceRepository } from '../domain/ports/PaymentPreferenceRepository.js';
import type { BlockchainGateway } from '../domain/ports/BlockchainGateway.js';
import { registerDeviceRoutes } from './routes/devices.js';
import { registerReadingRoutes } from './routes/readings.js';
import { registerMarketRoutes } from './routes/market.js';
import { registerTradeRoutes } from './routes/trades.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerPreferenceRoutes } from './routes/preferences.js';

export interface ApiDeps {
  deviceRepo: DeviceRepository;
  readingRepo: ReadingRepository;
  tradeRepo: TradeRepository;
  sessionRepo: MarketSessionRepository;
  preferenceRepo: PaymentPreferenceRepository;
  blockchain: BlockchainGateway;
}

export async function buildServer(deps: ApiDeps) {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  await app.register(cors, { origin: true });

  registerHealthRoutes(app);
  registerDeviceRoutes(app, deps.deviceRepo);
  registerReadingRoutes(app, deps.readingRepo);
  registerMarketRoutes(app, deps.sessionRepo);
  registerTradeRoutes(app, deps.tradeRepo, deps.blockchain);
  registerPreferenceRoutes(app, deps.preferenceRepo);

  return app;
}

import type { Auctioneer } from './Auctioneer.js';
import { createLogger } from '../logger.js';

const log = createLogger('market-scheduler');

export class MarketScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private auctioneer: Auctioneer,
    private intervalMs: number,
  ) {}

  start(): void {
    log.info({ intervalMs: this.intervalMs, intervalMin: this.intervalMs / 60000 }, 'Market scheduler started');
    this.timer = setInterval(() => {
      this.auctioneer.clear().catch((err) => {
        log.error({ err }, 'Market clearing error');
      });
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      log.info('Market scheduler stopped');
    }
  }
}

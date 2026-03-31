import type { OracleService } from './OracleService.js';
import { createLogger } from '../logger.js';

const log = createLogger('oracle-scheduler');

export class OracleScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private oracleService: OracleService,
    private intervalMs: number,
  ) {}

  start(): void {
    log.info({ intervalMs: this.intervalMs }, 'Oracle scheduler started');
    this.timer = setInterval(() => {
      this.oracleService.flush().catch((err) => {
        log.error({ err }, 'Oracle flush error');
      });
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      log.info('Oracle scheduler stopped');
    }
  }
}

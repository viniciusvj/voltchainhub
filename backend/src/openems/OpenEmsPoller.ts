import type { OpenEmsGateway } from '../domain/ports/OpenEmsGateway.js';
import type { ProducerAgent } from '../market/ProducerAgent.js';
import type { ConsumerAgent } from '../market/ConsumerAgent.js';
import { createLogger } from '../logger.js';

const log = createLogger('openems-poller');

export class OpenEmsPoller {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private gateway: OpenEmsGateway,
    private edgeId: string,
    private producer: ProducerAgent,
    private consumer: ConsumerAgent,
    private intervalMs: number = 30_000,
  ) {}

  start(): void {
    log.info({ edgeId: this.edgeId, intervalMs: this.intervalMs }, 'OpenEMS poller started');
    this.poll();
    this.timer = setInterval(() => this.poll(), this.intervalMs);
  }

  private poll(): void {
    this.gateway.fetchChannelValues(this.edgeId).then((values) => {
      // Convert instantaneous power (W) to energy over polling interval (Wh)
      const intervalHours = this.intervalMs / 3_600_000;
      const productionWh = values.productionActivePowerW * intervalHours;
      const consumptionWh = values.consumptionActivePowerW * intervalHours;

      this.producer.updateProduction(productionWh);
      this.consumer.updateDemand(consumptionWh);

      log.debug({
        productionW: values.productionActivePowerW,
        consumptionW: values.consumptionActivePowerW,
        soc: values.socPercent,
      }, 'OpenEMS telemetry updated');
    }).catch((err) => {
      log.error({ err }, 'OpenEMS poll failed');
    });
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      log.info('OpenEMS poller stopped');
    }
  }
}

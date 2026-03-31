import type { ChannelValues, OpenEmsGateway } from '../domain/ports/OpenEmsGateway.js';
import { CHANNEL_MAP } from './channel-map.js';
import { createLogger } from '../logger.js';

const log = createLogger('openems');

export interface OpenEmsClientConfig {
  url: string;
  username: string;
  password: string;
}

export class OpenEmsClient implements OpenEmsGateway {
  private connected = false;

  constructor(private config: OpenEmsClientConfig) {}

  async fetchChannelValues(edgeId: string): Promise<ChannelValues> {
    const url = `${this.config.url}/rest/channel/${edgeId}`;
    const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');

    try {
      const channels = Object.values(CHANNEL_MAP);
      const results: Record<string, number> = {};

      for (const channel of channels) {
        const resp = await fetch(`${url}/${channel}`, {
          headers: { Authorization: `Basic ${auth}` },
        });

        if (resp.ok) {
          const data = await resp.json() as { value?: number };
          results[channel] = data.value ?? 0;
          this.connected = true;
        } else {
          results[channel] = 0;
        }
      }

      return {
        productionActivePowerW: results[CHANNEL_MAP.production] ?? 0,
        consumptionActivePowerW: results[CHANNEL_MAP.consumption] ?? 0,
        gridActivePowerW: results[CHANNEL_MAP.grid] ?? 0,
        socPercent: results[CHANNEL_MAP.soc] ?? null,
      };
    } catch (err) {
      log.error({ err, edgeId }, 'Failed to fetch OpenEMS channel values');
      this.connected = false;
      return { productionActivePowerW: 0, consumptionActivePowerW: 0, gridActivePowerW: 0, socPercent: null };
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

import mqtt from 'mqtt';
import type { ReadingHandler } from './ReadingHandler.js';
import { createLogger } from '../logger.js';

const log = createLogger('mqtt');

export interface MqttListenerConfig {
  url: string;
  username?: string;
  password?: string;
  topicPrefix: string;
}

export class MqttListener {
  private client: mqtt.MqttClient | null = null;

  constructor(
    private config: MqttListenerConfig,
    private handler: ReadingHandler,
  ) {}

  start(): void {
    const { url, username, password, topicPrefix } = this.config;

    this.client = mqtt.connect(url, {
      username,
      password,
      clientId: `voltchain-backend-${Date.now()}`,
      clean: true,
      reconnectPeriod: 5000,
    });

    const topic = `${topicPrefix}/+/readings`;

    this.client.on('connect', () => {
      log.info({ url, topic }, 'MQTT connected');
      this.client!.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          log.error({ err, topic }, 'MQTT subscribe failed');
        } else {
          log.info({ topic }, 'Subscribed to readings');
        }
      });
    });

    this.client.on('message', (_topic, payload) => {
      try {
        this.handler.handle(payload.toString());
      } catch (err) {
        log.error({ err }, 'Error handling MQTT message');
      }
    });

    this.client.on('error', (err) => {
      log.error({ err }, 'MQTT error');
    });

    this.client.on('reconnect', () => {
      log.info('MQTT reconnecting...');
    });
  }

  stop(): void {
    if (this.client) {
      this.client.end(true);
      this.client = null;
      log.info('MQTT disconnected');
    }
  }
}

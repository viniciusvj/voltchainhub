import { loadEnv } from './infra/config/env.js';
import { getDb, closeDb } from './infra/db/sqlite.js';
import { SqliteDeviceRepository } from './infra/repositories/SqliteDeviceRepository.js';
import { SqliteReadingRepository } from './infra/repositories/SqliteReadingRepository.js';
import { SqliteTradeRepository } from './infra/repositories/SqliteTradeRepository.js';
import { SqliteMarketSessionRepository } from './infra/repositories/SqliteMarketSessionRepository.js';
import { EthersBlockchainGateway } from './infra/blockchain/EthersBlockchainGateway.js';
import { OpenEmsClient } from './openems/OpenEmsClient.js';
import { OpenEmsPoller } from './openems/OpenEmsPoller.js';
import { MqttListener } from './mqtt/MqttListener.js';
import { ReadingHandler } from './mqtt/ReadingHandler.js';
import { OracleService } from './oracle/OracleService.js';
import { OracleScheduler } from './oracle/OracleScheduler.js';
import { Auctioneer } from './market/Auctioneer.js';
import { ProducerAgent } from './market/ProducerAgent.js';
import { ConsumerAgent } from './market/ConsumerAgent.js';
import { MarketScheduler } from './market/MarketScheduler.js';
import { DEFAULT_MARKET_BASIS } from './domain/value-objects/MarketBasis.js';
import { buildServer } from './api/server.js';
import { createLogger } from './logger.js';

const log = createLogger('main');

async function main() {
  const env = loadEnv();
  log.info('Starting VoltChainHub backend...');

  // Database
  const db = getDb(env.DB_PATH);

  // Repositories
  const deviceRepo = new SqliteDeviceRepository(db);
  const readingRepo = new SqliteReadingRepository(db);
  const tradeRepo = new SqliteTradeRepository(db);
  const sessionRepo = new SqliteMarketSessionRepository(db);

  // Blockchain gateway
  const blockchain = new EthersBlockchainGateway(env);

  // Oracle service
  const oracleService = new OracleService(blockchain);
  const oracleScheduler = new OracleScheduler(oracleService, env.ORACLE_BATCH_INTERVAL_SECONDS * 1000);

  // MQTT
  const readingHandler = new ReadingHandler({
    deviceRepo,
    readingRepo,
    onVerifiedReading: (reading) => oracleService.enqueue(reading),
    timestampDriftTolerance: env.TIMESTAMP_DRIFT_TOLERANCE,
    anomalyZScoreThreshold: env.ANOMALY_ZSCORE_THRESHOLD,
  });

  const mqttListener = new MqttListener(
    {
      url: env.MQTT_URL,
      username: env.MQTT_USERNAME,
      password: env.MQTT_PASSWORD,
      topicPrefix: env.MQTT_TOPIC_PREFIX,
    },
    readingHandler,
  );

  // Market (PowerMatcher)
  const auctioneer = new Auctioneer(
    DEFAULT_MARKET_BASIS,
    sessionRepo,
    tradeRepo,
    blockchain,
    env.MIN_MARKET_PARTICIPANTS,
  );

  const producer = new ProducerAgent('producer-edge-0', DEFAULT_MARKET_BASIS);
  const consumer = new ConsumerAgent('consumer-edge-0', DEFAULT_MARKET_BASIS);
  auctioneer.registerAgent(producer);
  auctioneer.registerAgent(consumer);

  const marketScheduler = new MarketScheduler(auctioneer, env.MARKET_CYCLE_SECONDS * 1000);

  // OpenEMS adapter
  const openems = new OpenEmsClient({
    url: env.OPENEMS_URL,
    username: env.OPENEMS_USERNAME,
    password: env.OPENEMS_PASSWORD,
  });
  const openEmsPoller = new OpenEmsPoller(openems, 'edge0', producer, consumer);

  // REST API
  const server = await buildServer({
    deviceRepo,
    readingRepo,
    tradeRepo,
    sessionRepo,
    blockchain,
  });

  // Start all services
  mqttListener.start();
  oracleScheduler.start();
  marketScheduler.start();
  openEmsPoller.start();

  await server.listen({ port: env.PORT, host: env.HOST });
  log.info({ port: env.PORT, host: env.HOST }, 'VoltChainHub backend running');

  // Graceful shutdown
  const shutdown = async () => {
    log.info('Shutting down...');
    mqttListener.stop();
    oracleScheduler.stop();
    marketScheduler.stop();
    openEmsPoller.stop();
    await server.close();
    closeDb();
    log.info('Shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  log.fatal({ err }, 'Fatal error');
  process.exit(1);
});

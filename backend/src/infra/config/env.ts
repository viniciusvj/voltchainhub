import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  MQTT_URL: z.string().default('mqtt://localhost:1883'),
  MQTT_USERNAME: z.string().optional(),
  MQTT_PASSWORD: z.string().optional(),
  MQTT_TOPIC_PREFIX: z.string().default('voltchain'),

  RPC_URL: z.string().default('https://polygon-rpc.com'),
  CHAIN_ID: z.coerce.number().default(137),
  ORACLE_PRIVATE_KEY: z.string().default(''),
  ENERGY_ORACLE_ADDRESS: z.string().default(''),
  LUZ_TOKEN_ADDRESS: z.string().default(''),
  DEVICE_REGISTRY_ADDRESS: z.string().default(''),
  ENERGY_VAULT_ADDRESS: z.string().default(''),

  DB_PATH: z.string().default('./data/voltchain.db'),

  OPENEMS_URL: z.string().default('http://localhost:8084'),
  OPENEMS_USERNAME: z.string().default('admin'),
  OPENEMS_PASSWORD: z.string().default('admin'),

  MARKET_CYCLE_SECONDS: z.coerce.number().default(300),
  MIN_MARKET_PARTICIPANTS: z.coerce.number().default(2),
  ANOMALY_ZSCORE_THRESHOLD: z.coerce.number().default(3.0),
  ORACLE_BATCH_INTERVAL_SECONDS: z.coerce.number().default(60),
  TIMESTAMP_DRIFT_TOLERANCE: z.coerce.number().default(600),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function loadEnv(): Env {
  if (cachedEnv) return cachedEnv;
  cachedEnv = envSchema.parse(process.env);
  return cachedEnv;
}

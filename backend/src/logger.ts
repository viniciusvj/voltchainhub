import pino from 'pino';

const rootLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino/file', options: { destination: 1 } }
    : undefined,
});

export function createLogger(module: string) {
  return rootLogger.child({ module });
}

export { rootLogger };

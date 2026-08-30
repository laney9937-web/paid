import { pino } from 'pino';

const REDACT_PATHS = [
  'req.headers.cookie',
  'req.headers.authorization',
  '*.token',
  '*.guestToken',
  '*.continueUrl',
  '*.secret',
  '*.pan',
  '*.cvv',
  '*.cardNumber',
  '*.password',
  '*.digestHex',
];

export function createLogger(service: string, level = 'info') {
  return pino({
    name: service,
    level,
    redact: { paths: REDACT_PATHS, remove: true },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

export function assertNoSensitive(payload: unknown): void {
  const json = JSON.stringify(payload);
  if (/"pan"\s*:/i.test(json) || /"cvv"\s*:/i.test(json)) {
    throw new Error('sensitive payment data in log payload');
  }
}

export * from './otel';

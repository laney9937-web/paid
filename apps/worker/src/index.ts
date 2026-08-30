import { assertBootAllowed, loadConfig } from '@paid/config';
import { createPostgresOutboxRuntime, databaseHealth, loadLocalEnv } from '@paid/db';
import { createEmailMock } from '@paid/email-mock';
import { createLogger, startOtel } from '@paid/observability';
import { processOutbox } from './processor';

const log = createLogger('worker');

export async function runOnce(): Promise<number> {
  loadLocalEnv();
  startOtel('paid-worker');
  const config = loadConfig();
  const health = await databaseHealth();
  assertBootAllowed(config, health);
  const email = createEmailMock();
  return processOutbox(createPostgresOutboxRuntime(), email.adapter, log);
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('index.ts') ||
  process.argv[1]?.endsWith('index.js')
) {
  const processed = await runOnce();
  log.info({ processed }, 'worker pass complete');
}

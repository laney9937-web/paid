import { createLogger } from '@paid/observability';
import { createEmailMock } from '@paid/email-mock';
import { processOutbox } from './processor';
import { getWorkerStore } from './store';

const log = createLogger('worker');

export async function runOnce(): Promise<number> {
  const uow = getWorkerStore();
  const email = createEmailMock();
  return processOutbox(uow, email.adapter, log);
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('index.ts') ||
  process.argv[1]?.endsWith('index.js')
) {
  const processed = await runOnce();
  log.info({ processed }, 'worker pass complete');
}

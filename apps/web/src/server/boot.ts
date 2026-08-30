import { assertBootAllowed, loadConfig } from '@paid/config';
import { databaseHealth, loadLocalEnv } from '@paid/db';
import { startOtel } from '@paid/observability';
import { getWebAuth } from '@paid/auth';

export async function assertProcessBoot(service: string): Promise<void> {
  loadLocalEnv();
  startOtel(service);
  try {
    getWebAuth();
  } catch (error) {
    throw new Error(
      `Better Auth failed to start: ${error instanceof Error ? error.message : error}`,
    );
  }
  const config = loadConfig();
  const health = await databaseHealth();
  assertBootAllowed(config, health);
}

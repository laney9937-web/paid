import postgres from 'postgres';
import { loadLocalEnv } from './load-env';

let client: ReturnType<typeof postgres> | undefined;

export function databaseUrl(): string {
  loadLocalEnv();
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }
  return url;
}

export function getSql(): ReturnType<typeof postgres> {
  if (!client) {
    client = postgres(databaseUrl(), { max: 10 });
  }
  return client;
}

export async function closeSql(): Promise<void> {
  if (client) {
    await client.end({ timeout: 2 });
    client = undefined;
  }
}

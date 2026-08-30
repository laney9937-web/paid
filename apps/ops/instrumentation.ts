export async function register() {
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  const { loadLocalEnv } = await import('@paid/db');
  loadLocalEnv();
  const { assertBootAllowed, loadConfig } = await import('@paid/config');
  const { databaseHealth } = await import('@paid/db');
  const { startOtel } = await import('@paid/observability');
  const { getOpsAuth } = await import('@paid/auth');
  startOtel('paid-ops');
  getOpsAuth();
  assertBootAllowed(loadConfig(), await databaseHealth());
}

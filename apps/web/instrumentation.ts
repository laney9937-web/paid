export async function register() {
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  const { assertProcessBoot } = await import('./src/server/boot');
  await assertProcessBoot('paid-web');
}

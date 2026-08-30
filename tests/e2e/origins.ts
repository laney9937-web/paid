/** Playwright config sets these to the isolated web/ops origins for this run. */
export function webOrigin(): string {
  return process.env.WEB_ORIGIN ?? 'http://127.0.0.1:3000';
}

export function opsOrigin(): string {
  return process.env.OPS_ORIGIN ?? 'http://127.0.0.1:3001';
}

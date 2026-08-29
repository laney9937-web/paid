export const CREATOR_SESSION_IDLE_MS = 12 * 60 * 60 * 1000;
export const OPS_SESSION_IDLE_MS = 30 * 60 * 1000;
export const GUEST_SESSION_IDLE_MS = 7 * 24 * 60 * 60 * 1000;
export const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;
export const STEP_UP_WINDOW_MS = 10 * 60 * 1000;

export function isFresh(issuedAt: Date, now: Date, windowMs = STEP_UP_WINDOW_MS): boolean {
  return now.getTime() - issuedAt.getTime() <= windowMs;
}

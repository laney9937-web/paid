export const WEB_SESSION_COOKIE = 'paid_session';
export const OPS_SESSION_COOKIE = 'paid_ops_session';
export const GUEST_SESSION_COOKIE = 'paid_guest';
export const CONTINUATION_COOKIE = 'paid_continue';

export function sessionCookieOptions(origin: string) {
  const secure = origin.startsWith('https://');
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
  };
}

export function cacheHeadersPrivate(): Record<string, string> {
  return {
    'Cache-Control': 'private, no-store, max-age=0',
    Pragma: 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}

export function securityHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'",
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-Frame-Options': 'DENY',
  };
}

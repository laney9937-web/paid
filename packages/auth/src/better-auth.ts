import { betterAuth } from 'better-auth';
import { passkey } from '@better-auth/passkey';

export function createPaidAuth(opts: {
  secret: string;
  baseURL: string;
  rpID: string;
  origin: string;
  cookieName: string;
}): unknown {
  return betterAuth({
    secret: opts.secret,
    baseURL: opts.baseURL,
    emailAndPassword: { enabled: false },
    trustedOrigins: [opts.origin],
    session: { cookieCache: { enabled: false } },
    advanced: { cookiePrefix: opts.cookieName },
    plugins: [
      passkey({
        rpID: opts.rpID,
        rpName: 'Paid',
        origin: opts.origin,
      }),
    ],
  });
}

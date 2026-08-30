import { betterAuth } from 'better-auth';
import { passkey } from '@better-auth/passkey';

export type PaidAuth = {
  handler: (request: Request) => Promise<Response>;
};

export function createPaidAuth(opts: {
  secret: string;
  baseURL: string;
  rpID: string;
  origin: string;
  cookieName: string;
}): PaidAuth {
  const auth = betterAuth({
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
  return auth as unknown as PaidAuth;
}

let webAuth: PaidAuth | undefined;
let opsAuth: PaidAuth | undefined;

export function getWebAuth(): PaidAuth {
  if (!webAuth) {
    webAuth = createPaidAuth({
      secret: process.env.BETTER_AUTH_SECRET ?? 'local-dev-better-auth-secret-32b-min!!',
      baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
      rpID: process.env.PASSKEY_RP_ID ?? 'localhost',
      origin: process.env.PASSKEY_ORIGIN ?? 'http://localhost:3000',
      cookieName: 'paid_session',
    });
  }
  return webAuth;
}

export function getOpsAuth(): PaidAuth {
  if (!opsAuth) {
    opsAuth = createPaidAuth({
      secret: process.env.BETTER_AUTH_SECRET ?? 'local-dev-better-auth-secret-32b-min!!',
      baseURL: process.env.OPS_ORIGIN ?? 'http://localhost:3001',
      rpID: process.env.OPS_PASSKEY_RP_ID ?? 'localhost',
      origin: process.env.OPS_PASSKEY_ORIGIN ?? 'http://localhost:3001',
      cookieName: 'paid_ops_session',
    });
  }
  return opsAuth;
}

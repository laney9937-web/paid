import { createHmac, timingSafeEqual } from 'node:crypto';
import { AppError } from './errors';

export type TokenKeyring = Readonly<{
  currentVersion: string;
  keys: Readonly<Record<string, string>>;
}>;

export type TokenDigest = Readonly<{
  keyVersion: string;
  digestHex: string;
}>;

export function hmacToken(
  keyring: TokenKeyring,
  token: string,
  keyVersion = keyring.currentVersion,
): TokenDigest {
  const key = keyring.keys[keyVersion];
  if (!key) {
    throw new AppError('INTERNAL_ERROR', `Unknown token key version ${keyVersion}`);
  }
  const digestHex = createHmac('sha256', `${keyVersion}:${key}`)
    .update(token, 'utf8')
    .digest('hex');
  return { keyVersion, digestHex };
}

export function tokenDigestsEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  if (left.length === 0 || left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function lookupTokenDigest(keyring: TokenKeyring, token: string): TokenDigest[] {
  return Object.keys(keyring.keys).map((version) => hmacToken(keyring, token, version));
}

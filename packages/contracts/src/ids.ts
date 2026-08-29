import { randomBytes } from 'node:crypto';
import { AppError } from './errors';

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function encodeCrockford(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += CROCKFORD[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += CROCKFORD[(value << (5 - bits)) & 31];
  }
  return output;
}

export function randomCrockford(byteLength: number): string {
  return encodeCrockford(randomBytes(byteLength));
}

/** 10-character uppercase Crockford Base32 public order code. Not a secret. */
export function generatePublicOrderCode(): string {
  return randomCrockford(6).slice(0, 10);
}

/** Shareable transaction-link ID: ≥128 bits of entropy. Identifies the offer, not receipt access. */
export function generateShareableLinkId(): string {
  return encodeCrockford(randomBytes(16));
}

/** Guest/magic/recovery token: ≥256 bits of entropy. Store only HMAC digest. */
export function generateSecretToken(): string {
  return randomBytes(32).toString('base64url');
}

export function assertPublicOrderCode(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!/^[0-9A-HJKMNP-TV-Z]{10}$/.test(normalized)) {
    throw new AppError('VALIDATION_FAILED', 'Invalid public order code');
  }
  return normalized;
}

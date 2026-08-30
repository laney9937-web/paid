import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { AppError } from '@paid/contracts';

export type RestrictedKeyring = {
  currentVersion: string;
  keys: Record<string, string>;
};

export type SealedSecret = {
  ciphertext: Buffer;
  nonce: Buffer;
  authTag: Buffer;
  keyVersion: string;
};

function aesKey(material: string, version: string): Buffer {
  return createHash('sha256').update(`paid.restricted.${version}.${material}`).digest();
}

export function sealSecret(plaintext: string, keyring: RestrictedKeyring): SealedSecret {
  const keyVersion = keyring.currentVersion;
  const material = keyring.keys[keyVersion];
  if (!material) {
    throw new AppError('INTERNAL_ERROR', 'Restricted field key is not configured');
  }
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', aesKey(material, keyVersion), nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return { ciphertext, nonce, authTag: cipher.getAuthTag(), keyVersion };
}

export function openSecret(
  sealed: { ciphertext: Buffer; nonce: Buffer; authTag: Buffer; keyVersion: string },
  keyring: RestrictedKeyring,
): string {
  const material = keyring.keys[sealed.keyVersion];
  if (!material) {
    throw new AppError('INTERNAL_ERROR', 'Restricted field key version is unknown');
  }
  const decipher = createDecipheriv(
    'aes-256-gcm',
    aesKey(material, sealed.keyVersion),
    sealed.nonce,
  );
  decipher.setAuthTag(sealed.authTag);
  return Buffer.concat([decipher.update(sealed.ciphertext), decipher.final()]).toString('utf8');
}

export function defaultRestrictedKeyring(
  material = 'test-restricted-field-key-32bytes',
): RestrictedKeyring {
  return { currentVersion: 'v1', keys: { v1: material } };
}

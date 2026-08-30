import { AppError } from '@paid/contracts';

const ALLOWED_PREFIXES = ['/checkout/return/', '/transaction/', '/guest/access/'];

/**
 * Browser return URLs cannot bounce the user to an arbitrary origin or mark payment captured.
 */
export function safeCheckoutReturnPath(input: {
  requested?: string | null;
  fallback: string;
}): string {
  const requested = input.requested?.trim();
  if (!requested) return input.fallback;
  if (
    requested.startsWith('http:') ||
    requested.startsWith('https:') ||
    requested.startsWith('//') ||
    requested.includes('\\') ||
    requested.includes('://') ||
    requested.startsWith('/\\') ||
    /[\s@]/.test(requested)
  ) {
    throw new AppError('VALIDATION_FAILED', 'Return URL is not allowed');
  }
  if (!ALLOWED_PREFIXES.some((prefix) => requested.startsWith(prefix))) {
    throw new AppError('VALIDATION_FAILED', 'Return URL is not allowed');
  }
  if (requested.includes('..')) {
    throw new AppError('VALIDATION_FAILED', 'Return URL is not allowed');
  }
  return requested;
}

export function checkoutReturnIsNotCapture(): true {
  return true;
}

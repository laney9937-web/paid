import type { DeliveryDuration } from '@paid/contracts';
import { AppError } from '@paid/contracts';

export function deliveryDurationMs(duration: DeliveryDuration): number {
  switch (duration) {
    case 'PT24H':
      return 24 * 3600 * 1000;
    case 'PT48H':
      return 48 * 3600 * 1000;
    case 'P7D':
      return 7 * 86400 * 1000;
    default:
      throw new AppError('VALIDATION_FAILED', `Unknown delivery duration ${duration as string}`);
  }
}

export function addDuration(from: Date, duration: DeliveryDuration): Date {
  return new Date(from.getTime() + deliveryDurationMs(duration));
}

export function deliveryLabel(duration: DeliveryDuration): string {
  switch (duration) {
    case 'PT24H':
      return 'Delivery within 24 hours';
    case 'PT48H':
      return 'Delivery within 48 hours';
    case 'P7D':
      return 'Delivery within 7 days';
  }
}

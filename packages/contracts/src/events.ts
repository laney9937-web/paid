import { z } from 'zod';
import { moneyWireSchema, type MoneyWire } from './money';

export const PROVIDER_RESOURCE_TYPES = [
  'CREATOR',
  'CHECKOUT',
  'PAYMENT',
  'REFUND',
  'DISPUTE',
  'PAYOUT',
  'SETTLEMENT',
  'UNKNOWN',
] as const;

export type ProviderResourceType = (typeof PROVIDER_RESOURCE_TYPES)[number];

export type CanonicalProviderEvent = Readonly<{
  canonicalEventId: string;
  provider: string;
  providerConfigurationId: string;
  adapterVersion: string;
  schemaVersion: number;
  eventType: string;
  providerEventId: string;
  providerResourceType: ProviderResourceType;
  providerResourceId: string;
  occurredAt: string;
  receivedAt: string;
  amount?: MoneyWire;
  rawPayloadDigest: string;
  verificationKeyVersion: string;
  normalizedData: unknown;
}>;

export const canonicalProviderEventSchema = z.object({
  canonicalEventId: z.string().min(8),
  provider: z.string().min(1),
  providerConfigurationId: z.string().min(1),
  adapterVersion: z.string().min(1),
  schemaVersion: z.number().int().positive(),
  eventType: z.string().min(1),
  providerEventId: z.string().min(1),
  providerResourceType: z.enum(PROVIDER_RESOURCE_TYPES),
  providerResourceId: z.string().min(1),
  occurredAt: z.string().datetime(),
  receivedAt: z.string().datetime(),
  amount: moneyWireSchema.optional(),
  rawPayloadDigest: z.string().min(16),
  verificationKeyVersion: z.string().min(1),
  normalizedData: z.unknown(),
});

export const KNOWN_EVENT_TYPES = [
  'CHECKOUT_CREATED',
  'PAYMENT_AUTHORIZED',
  'PAYMENT_CAPTURED',
  'PAYMENT_FAILED',
  'PAYMENT_PAID_TIME_CORRECTED',
  'REFUND_SUCCEEDED',
  'REFUND_FAILED',
  'DISPUTE_OPENED',
  'DISPUTE_WON',
  'DISPUTE_LOST',
  'PAYOUT_PAID',
  'PAYOUT_FAILED',
  'PAYOUT_REVERSED',
  'UNKNOWN_VALID',
] as const;

export type KnownEventType = (typeof KNOWN_EVENT_TYPES)[number];

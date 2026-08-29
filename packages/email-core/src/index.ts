export type EmailMessage = {
  toDigest: string;
  templateId: string;
  templateVersion: string;
  variables: Record<string, string>;
};

export interface EmailProviderAdapter {
  readonly name: string;
  send(message: EmailMessage): Promise<{ accepted: boolean; providerMessageId: string }>;
}

export const EMAIL_TEMPLATES = {
  MAGIC_LINK: { id: 'magic-link', version: 'v1' },
  GUEST_RECEIPT: { id: 'guest-receipt', version: 'v1' },
  DELIVERED: { id: 'delivered', version: 'v1' },
  SECURITY_ALERT: { id: 'security-alert', version: 'v1' },
} as const;

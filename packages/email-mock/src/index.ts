import type { EmailMessage, EmailProviderAdapter } from '@paid/email-core';

export type CapturedEmail = EmailMessage & { providerMessageId: string; bounced: boolean };

export function createEmailMock(opts: { bounce?: boolean } = {}) {
  const sent: CapturedEmail[] = [];
  const adapter: EmailProviderAdapter = {
    name: 'email-mock',
    async send(message) {
      const bounced = Boolean(opts.bounce);
      const existing = sent.find(
        (row) =>
          row.toDigest === message.toDigest &&
          row.templateId === message.templateId &&
          row.templateVersion === message.templateVersion,
      );
      if (existing) {
        return { accepted: !existing.bounced, providerMessageId: existing.providerMessageId };
      }
      const providerMessageId = `em_${sent.length + 1}`;
      sent.push({ ...message, providerMessageId, bounced });
      return { accepted: !bounced, providerMessageId };
    },
  };
  return { adapter, sent };
}

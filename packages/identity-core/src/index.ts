export type IdentityStatus = 'VERIFIED' | 'PENDING' | 'REJECTED' | 'NEEDS_INFORMATION' | 'UNKNOWN';
export type AgeStatus = 'VERIFIED_ADULT' | 'PENDING' | 'REJECTED' | 'UNKNOWN';

export interface IdentityVerificationAdapter {
  readonly name: string;
  startVerification(creatorId: string): Promise<{ sessionId: string }>;
  getStatus(creatorId: string): Promise<{ identity: IdentityStatus; age: AgeStatus }>;
}

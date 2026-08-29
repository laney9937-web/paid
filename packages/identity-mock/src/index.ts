import type { AgeStatus, IdentityStatus, IdentityVerificationAdapter } from '@paid/identity-core';

export function createIdentityMock(
  state: { identity: IdentityStatus; age: AgeStatus } = {
    identity: 'VERIFIED',
    age: 'VERIFIED_ADULT',
  },
): IdentityVerificationAdapter {
  return {
    name: 'identity-mock',
    async startVerification(creatorId) {
      return { sessionId: `id_${creatorId}` };
    },
    async getStatus() {
      return state;
    },
  };
}

import type { ActorContext } from '@paid/contracts';

export function creatorActor(creatorId = 'creator_maya'): ActorContext {
  return {
    actorType: 'CREATOR',
    actorId: creatorId,
    creatorId,
    sessionId: 'sess_creator',
    authStrength: 'PASSKEY',
    requestId: 'req_creator',
  };
}

export function guestActor(transactionId: string): ActorContext {
  return {
    actorType: 'GUEST',
    actorId: `guest_${transactionId}`,
    guestTransactionId: transactionId,
    sessionId: 'sess_guest',
    authStrength: 'EMAIL_LINK',
    requestId: 'req_guest',
  };
}

export function publicActor(): ActorContext {
  return { actorType: 'PUBLIC', authStrength: 'NONE', requestId: 'req_public' };
}

export function opsActor(roles: ActorContext['opsRoles'] = ['DISPUTES', 'PAYMENTS']): ActorContext {
  return {
    actorType: 'OPS',
    actorId: 'ops_1',
    opsRoles: roles,
    sessionId: 'sess_ops',
    authStrength: 'STEP_UP',
    requestId: 'req_ops',
  };
}

export function providerActor(): ActorContext {
  return {
    actorType: 'PROVIDER',
    actorId: 'mock',
    authStrength: 'SERVICE',
    requestId: 'req_provider',
  };
}

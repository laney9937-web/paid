import { toNextJsHandler } from 'better-auth/next-js';
import { getOpsAuth } from '@paid/auth';

export const { GET, POST } = toNextJsHandler(getOpsAuth());

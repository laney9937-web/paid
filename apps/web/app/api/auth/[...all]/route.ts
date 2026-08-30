import { toNextJsHandler } from 'better-auth/next-js';
import { getWebAuth } from '@paid/auth';

export const { GET, POST } = toNextJsHandler(getWebAuth());

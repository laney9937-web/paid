import type { BrowserContext } from '@playwright/test';
import { LOCAL_DEV_CREATOR_SESSION } from '@paid/db';
import { WEB_SESSION_COOKIE } from '@paid/auth';
import { webOrigin } from './origins';

export async function addCreatorSessionCookie(context: BrowserContext) {
  await context.addCookies([
    {
      name: WEB_SESSION_COOKIE,
      value: LOCAL_DEV_CREATOR_SESSION,
      url: webOrigin(),
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

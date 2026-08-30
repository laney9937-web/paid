import type { BrowserContext } from '@playwright/test';
import { LOCAL_DEV_CREATOR_SESSION } from '@paid/db';
import { WEB_SESSION_COOKIE } from '@paid/auth';

export async function addCreatorSessionCookie(context: BrowserContext) {
  await context.addCookies([
    {
      name: WEB_SESSION_COOKIE,
      value: LOCAL_DEV_CREATOR_SESSION,
      url: 'http://127.0.0.1:3000',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

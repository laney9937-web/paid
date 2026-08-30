import { expect, test } from '@playwright/test';
import { getSql } from '@paid/db';

async function latestContinueUrl(template: string): Promise<string> {
  const sql = getSql();
  const rows = await sql`
    SELECT payload FROM outbox_jobs
    WHERE type = 'EMAIL_MAGIC_LINK'
    ORDER BY created_at DESC
    LIMIT 16
  `;
  for (const raw of rows) {
    const payload = (raw as { payload: { continueUrl?: string; template?: string } }).payload;
    if (payload?.template === template && payload.continueUrl) return payload.continueUrl;
  }
  throw new Error(`missing ${template} continueUrl`);
}

test('unauthenticated creator home and account redirect to sign-in', async ({ page }) => {
  await page.goto('/creator/home');
  await expect(page).toHaveURL(/\/creator\/sign-in/);
  await expect(page.getByTestId('home-available')).toHaveCount(0);
  await page.goto('/creator/account');
  await expect(page).toHaveURL(/\/creator\/sign-in/);
  await expect(page.getByText(/^Public name: Maya$/)).toHaveCount(0);
});

test('unauthenticated ops pages redirect to staff sign-in', async ({ page }) => {
  for (const path of ['/ops/cases', '/ops/audit', '/ops/risk']) {
    await page.goto(`http://127.0.0.1:3001${path}`);
    await expect(page).toHaveURL(/\/ops\/sign-in/);
    await expect(page.getByTestId('ops-hold')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Paid operations/i })).toBeVisible();
  }
});

test('creator magic-link POST issue, GET continue does not consume, POST sets session', async ({
  page,
  request,
}) => {
  const issued = await request.post('/api/creator/magic-link', {
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    data: { email: 'maya@paid.example' },
  });
  const body = await issued.json();
  expect(body.message).toContain('If an account exists');
  const continueUrl = await latestContinueUrl('magic-link');
  const token = new URL(continueUrl).searchParams.get('token') ?? '';
  expect(JSON.stringify(body)).not.toContain(token);
  const path = `${new URL(continueUrl).pathname}${new URL(continueUrl).search}`;

  const firstGet = await request.get(`http://127.0.0.1:3000${path}`);
  const firstHtml = await firstGet.text();
  const secondGet = await request.get(`http://127.0.0.1:3000${path}`);
  const secondHtml = await secondGet.text();
  expect(firstHtml).toContain('scanners can open this page without signing you in');
  expect(secondHtml).toContain('scanners can open this page without signing you in');
  expect(firstHtml).not.toContain('already used');
  expect(secondHtml).not.toContain('already used');

  await page.goto(path);
  await page.getByTestId('magic-continue').click();
  await expect(page).toHaveURL(/\/creator\/home/);
  await expect(page.getByTestId('home-available')).toBeVisible();
});

test('ops magic-link POST issue then consume sets staff session', async ({ page, request }) => {
  const issued = await request.post('http://127.0.0.1:3001/api/ops/magic-link', {
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    data: { email: 'ops@paid.example' },
  });
  const body = await issued.json();
  expect(body.message).toContain('If an account exists');
  const continueUrl = await latestContinueUrl('magic-link-ops');
  const path = `${new URL(continueUrl).pathname}${new URL(continueUrl).search}`;
  const peek = await request.get(`http://127.0.0.1:3001${path}`);
  expect(await peek.text()).toContain('scanners can open this page without signing you in');
  await page.goto(`http://127.0.0.1:3001${path}`);
  await page.getByTestId('ops-magic-continue').click();
  await expect(page).toHaveURL(/\/ops\/cases/);
});

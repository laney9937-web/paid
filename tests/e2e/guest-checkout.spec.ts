import { expect, test } from '@playwright/test';
import { addCreatorSessionCookie } from './session';

test('guest GET prefetch does not consume, POST exchanges, mock pay, no double-submit', async ({
  page,
  context,
  request,
}) => {
  await addCreatorSessionCookie(context);
  await page.goto('/creator/create');
  await page.getByTestId('link-amount').fill('35.00');
  await page.getByTestId('create-link').click();
  const shareUrl = (await page.getByTestId('share-url').innerText()).trim();

  await page.goto(shareUrl);
  const pay = page.getByTestId('continue-to-pay');
  await expect(pay).toBeEnabled();

  let checkoutPosts = 0;
  await page.route('**/api/transactions/checkout-sessions', async (route) => {
    if (route.request().method() === 'POST') checkoutPosts += 1;
    await route.continue();
  });

  await pay.click();
  await expect(page.getByTestId('guest-continue')).toBeVisible({ timeout: 20000 });
  expect(checkoutPosts).toBe(1);
  await expect(page.getByTestId('continue-to-pay')).toHaveCount(0);

  const guestUrl = page.url();
  expect(guestUrl).toMatch(/\/guest\/access\//);

  const prefetchOne = await request.get(guestUrl);
  const prefetchTwo = await request.get(guestUrl);
  expect(prefetchOne.ok()).toBe(true);
  expect(prefetchTwo.ok()).toBe(true);
  const bodyOne = await prefetchOne.text();
  const bodyTwo = await prefetchTwo.text();
  expect(bodyOne).toContain('scanners can open this page without unlocking');
  expect(bodyTwo).toContain('scanners can open this page without unlocking');
  expect(bodyOne).not.toContain('already used');
  expect(bodyTwo).not.toContain('already used');

  await page.goto(guestUrl);
  await page.getByTestId('guest-continue').click();
  await expect(page.getByTestId('receipt-status')).toHaveText('Payment pending', {
    timeout: 20000,
  });
  await expect(page.getByTestId('guest-authorized')).toBeVisible();

  await page.getByTestId('complete-mock-payment').click();
  await expect(page.getByTestId('receipt-status')).toHaveText('Paid', { timeout: 15000 });
  await expect(page.getByTestId('order-code')).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('receipt-status')).toHaveText('Paid');
  await expect(page.getByTestId('guest-authorized')).toBeVisible();
});

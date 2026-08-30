import { expect, test } from '@playwright/test';
import { addCreatorSessionCookie } from './session';

test('creator creates a one-time shareable link', async ({ page, context }) => {
  await addCreatorSessionCookie(context);
  await page.goto('/creator/create');
  await page.getByTestId('link-amount').fill('42.00');
  await page.getByTestId('create-link').click();
  const share = page.getByTestId('share-url');
  await expect(share).toBeVisible();
  const url = await share.innerText();
  expect(url).toMatch(/\/t\/[A-Z0-9]+/i);
  await page.goto(url.trim());
  await expect(page.getByText('$42.00')).toBeVisible();
  await expect(page.getByTestId('continue-to-pay')).toBeVisible();
});

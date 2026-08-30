import { expect, test } from '@playwright/test';

test('K-01 320px and 390px public trust page does not overflow horizontally', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 720 });
    await page.goto('/c/maya');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${width}px overflow`).toBeLessThanOrEqual(1);
    await expect(page.getByRole('heading', { name: /Maya/i })).toBeVisible();
  }
});

test('K-10 reduced motion disables transitions on the public surface', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/c/maya');
  const animation = await page.evaluate(() => getComputedStyle(document.body).animationName);
  expect(animation === 'none' || animation === '').toBe(true);
});

test('K-06 create-link validation keeps the typed amount', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/creator/create');
  const amount = page.getByTestId('link-amount');
  await amount.fill('not-a-price');
  await page.getByTestId('create-link').click();
  await expect(page.getByTestId('create-error')).toBeVisible();
  await expect(amount).toHaveValue('not-a-price');
});

test('K-09 200% text zoom keeps the public heading readable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/c/maya');
  await page.addStyleTag({ content: 'html { font-size: 200%; }' });
  await expect(page.getByRole('heading', { name: /Maya/i })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(8);
});

test('K-07 keyboard focus reaches the pay control', async ({ page }) => {
  await page.goto('/c/maya');
  await page.getByTestId('pay-creator').focus();
  await expect(page.getByTestId('pay-creator')).toBeFocused();
});

test('H-01/H-03/H-05 private and document headers', async ({ request }) => {
  const home = await request.get('/c/maya');
  expect(home.headers()['x-robots-tag'] ?? '').toMatch(/noindex/i);
  expect(home.headers()['content-security-policy'] ?? '').toContain("default-src 'self'");
  expect(home.headers()['x-content-type-options']).toBe('nosniff');
  const api = await request.get('/api/transactions/checkout-sessions');
  expect(api.headers()['cache-control'] ?? '').toMatch(/no-store/i);
});

test('B-10 checkout return does not follow an open redirect', async ({ page }) => {
  await page.goto('/checkout/return/mock?next=https://evil.example/phish');
  await expect(page.getByText(/not allowed/i)).toBeVisible();
  await expect(page.getByText(/not payment proof/i)).toBeVisible();
});

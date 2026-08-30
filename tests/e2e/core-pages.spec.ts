import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { opsOrigin } from './origins';

test('public creator trust page renders product surface', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('/c/maya');
  await expect(page.getByRole('heading', { name: /Maya/i })).toBeVisible();
  await expect(page.getByTestId('trust-tier')).toHaveText(
    /^(BUILDING|ESTABLISHED|HIGH|EXCEPTIONAL) TRUST$/,
  );
  await expect(page.getByText(/Pay Maya/i)).toBeVisible();
  expect(errors).toEqual([]);
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious'),
  ).toEqual([]);
});

test('ops sign-in is an isolated staff boundary', async ({ page }) => {
  await page.goto(`${opsOrigin()}/ops/sign-in`);
  await expect(page.getByRole('heading', { name: /Paid operations/i })).toBeVisible();
  await expect(page.getByText(/Order codes are not credentials/i)).toBeVisible();
});

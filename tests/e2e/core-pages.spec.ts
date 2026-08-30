import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { opsOrigin } from './origins';

test('public creator trust page renders product surface', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('/c/maya');
  await expect(page.getByRole('heading', { name: /Maya/i })).toBeVisible();
  await expect(page.getByTestId('trust-tier')).toHaveText('New creator');
  await expect(page.getByTestId('trust-tier')).not.toHaveText(/HIGH TRUST/);
  await expect(page.getByTestId('identity-mark')).toBeVisible();
  await expect(page.getByTestId('identity-copy')).toHaveText(/Identity verified/);
  await expect(page.getByText(/Pay Maya/i)).toBeVisible();
  expect(errors).toEqual([]);
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious'),
  ).toEqual([]);
});

test('unverified creator is not shown as verified or HIGH TRUST', async ({ page }) => {
  await page.goto('/c/nova');
  await expect(page.getByRole('heading', { name: /Nova/i })).toBeVisible();
  await expect(page.getByTestId('identity-mark')).toHaveCount(0);
  await expect(page.getByTestId('identity-copy')).toHaveText(/Identity not verified/);
  await expect(page.getByTestId('trust-tier')).toHaveText('New creator');
  await expect(page.getByTestId('trust-tier')).not.toHaveText(/HIGH TRUST/);
});

test('ops sign-in is an isolated staff boundary', async ({ page }) => {
  await page.goto(`${opsOrigin()}/ops/sign-in`);
  await expect(page.getByRole('heading', { name: /Paid operations/i })).toBeVisible();
  await expect(page.getByText(/Order codes are not credentials/i)).toBeVisible();
});

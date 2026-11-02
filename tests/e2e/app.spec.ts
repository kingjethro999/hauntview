import { test, expect } from '@playwright/test';

test.describe('HauntView Dashboard & Navigation', () => {
  test('loads home page parlour with title and test launcher', async ({ page }) => {
    await page.goto('/');

    // Check header and branding
    await expect(page).toHaveTitle(/HauntView/i);
    await expect(page.getByRole('link', { name: /HauntView/i })).toBeVisible();

    // Check URL input exists
    const urlInput = page.getByPlaceholder(/http:\/\/localhost:3000 or https:\/\/your-site\.com/i);
    await expect(urlInput).toBeVisible();

    // Check Run Rites or Start button exists
    const launchButton = page.getByRole('button', { name: /run .* test profiles/i });
    await expect(launchButton).toBeVisible();
  });

  test('navigates to The Crypt run history', async ({ page }) => {
    await page.goto('/crypt');

    // Verify Crypt history page loads
    await expect(page.getByText(/The Crypt|Run History|Historical/i).first()).toBeVisible();
  });
});

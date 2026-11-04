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

    // Check Haunt House launch button exists
    const launchButton = page.getByRole('button', { name: /haunt house with .* rites/i });
    await expect(launchButton).toBeVisible();
  });

  test('interacts with Haunted House windows and Porch Lantern', async ({ page }) => {
    await page.goto('/');

    // Check Haunted House SVG exists
    await expect(
      page.getByText(
        /Click windows to summon rites • Click (?:heavy )?front door to haunt with all/i
      )
    ).toBeVisible();

    // Find and click a window
    const windowBtn = page.getByRole('button', { name: /Console Errors/i }).first();
    await expect(windowBtn).toBeVisible();
    await windowBtn.click();

    // Click quick pick preset to ignite porch lantern and candle
    const localhostPreset = page.getByRole('button', { name: /localhost:3000/i });
    await expect(localhostPreset).toBeVisible();
    await localhostPreset.click();

    // URL input should now have the preset URL
    const urlInput = page.getByPlaceholder(/http:\/\/localhost:3000 or https:\/\/your-site\.com/i);
    await expect(urlInput).toHaveValue('http://localhost:3000');
  });

  test('navigates to The Crypt run history', async ({ page }) => {
    await page.goto('/crypt');

    // Verify Crypt history page loads
    await expect(page.getByText(/The Crypt|Run History|Historical/i).first()).toBeVisible();
  });
});

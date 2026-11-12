import { test, expect, type Page } from '@playwright/test';

/**
 * End-to-end coverage for the séance UI: door navigation, the séance table
 * launcher, results verdict, the crypt graveyard (banish flow) and the scroll.
 *
 * Network calls that would launch real browser runs or read server history are
 * mocked, so the suite is deterministic and fast.
 */

const TOTAL_RITES = 26;

// Functional tests run with reduced motion: it switches off the full-screen
// grain/fog/particle layers (heavy under software rendering in CI) and keeps
// that accessibility path covered. One test below checks the full atmosphere.
test.use({ reducedMotion: 'reduce' });

const SUMMARY = {
  id: 'hauntview-e2e-1',
  url: 'https://example.com/',
  startTime: Date.UTC(2026, 10, 11, 14, 18),
  duration: 12_400,
  totalProfiles: 2,
  successfulProfiles: 1,
  failedProfiles: 1,
  totalFindings: 3,
  errorCount: 1,
  warningCount: 2,
};

function fakeReport(id = SUMMARY.id) {
  const finding = (n: number, severity: 'error' | 'warning', profileId: string) => ({
    id: `f-${n}`,
    profileId,
    severity,
    category: severity === 'error' ? 'images' : 'contrast',
    message:
      severity === 'error'
        ? 'Hero image failed to load\nCall log:\n  - navigating to "https://example.com/"'
        : `Low contrast text #${n}`,
    timestamp: SUMMARY.startTime,
    isClassified: true,
  });
  return {
    id,
    url: SUMMARY.url,
    startTime: SUMMARY.startTime,
    endTime: SUMMARY.startTime + SUMMARY.duration,
    duration: SUMMARY.duration,
    profileResults: [
      {
        profileId: 'image-failure',
        profileName: 'Image Failure',
        success: false,
        startTime: SUMMARY.startTime,
        endTime: SUMMARY.startTime + 5000,
        duration: 5000,
        findings: [finding(1, 'error', 'image-failure')],
        screenshots: [],
        metadata: { browserEngine: 'chromium', browserVersion: '0', nodeVersion: '22' },
      },
      {
        profileId: 'a11y-visual',
        profileName: 'Visual Impairment',
        success: true,
        startTime: SUMMARY.startTime,
        endTime: SUMMARY.startTime + 7400,
        duration: 7400,
        findings: [finding(2, 'warning', 'a11y-visual'), finding(3, 'warning', 'a11y-visual')],
        screenshots: [],
        metadata: { browserEngine: 'chromium', browserVersion: '0', nodeVersion: '22' },
      },
    ],
    summary: {
      totalProfiles: 2,
      successfulProfiles: 1,
      failedProfiles: 1,
      totalFindings: 3,
      findingsBySeverity: { error: 1, warning: 2, info: 0 },
      findingsByCategory: { images: 1, contrast: 2 },
      canonicalizedFindings: 3,
    },
  };
}

/** Mock server history (list) and swallow per-report sync calls. */
async function mockHistory(page: Page, reports: (typeof SUMMARY)[] = []) {
  await page.route(/\/api\/results$/, (route) =>
    route.fulfill({ json: { success: true, reports } })
  );
  await page.route(/\/api\/results\/[^/?]+$/, (route) =>
    route.fulfill({ json: { success: true } })
  );
}

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test.describe('Door navigation', () => {
  test('marks the current room and moves between rooms', async ({ page }) => {
    await mockHistory(page);
    await page.goto('/');
    await expect(page).toHaveTitle(/HauntView/i);
    await expect(page.getByRole('link', { name: 'HauntView home' })).toBeVisible();

    const primary = page.getByRole('navigation', { name: 'Primary' }).first();
    await expect(primary.getByRole('link', { name: 'Parlour' })).toHaveAttribute(
      'aria-current',
      'page'
    );

    await primary.getByRole('link', { name: 'Crypt' }).click();
    await expect(page).toHaveURL(/\/crypt$/);
    await expect(primary.getByRole('link', { name: 'Crypt' })).toHaveAttribute(
      'aria-current',
      'page'
    );

    await primary.getByRole('link', { name: 'Scroll' }).click();
    await expect(page).toHaveURL(/\/docs$/);
    await expect(page.getByRole('heading', { level: 1, name: /Read the rites/i })).toBeVisible();
  });

  test('sound is muted until asked for', async ({ page }) => {
    await mockHistory(page);
    await page.goto('/');
    const sound = page.getByRole('button', { name: /ambient wind/i });
    await expect(sound).toHaveAttribute('aria-pressed', 'false');
  });
});

test.describe('Parlour — the séance table', () => {
  test.beforeEach(async ({ page }) => {
    await mockHistory(page);
    await page.goto('/');
  });

  test('every rite starts lit and the address is ready', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: /Who haunts your website/i })
    ).toBeVisible();
    await expect(page.getByLabel('The house at')).toHaveValue('http://localhost:3000');

    const ring = page.getByRole('group', { name: 'Rites around the séance table' });
    const candles = ring.getByRole('button', { pressed: true });
    await expect(candles).toHaveCount(TOTAL_RITES);
    await expect(page.getByText(`${TOTAL_RITES} of ${TOTAL_RITES} candles lit`)).toBeVisible();
    await expect(page.getByRole('button', { name: /^Begin/ })).toBeEnabled();
  });

  test('snuffing a candle in the ring updates the ledger and the count', async ({ page }) => {
    const ring = page.getByRole('group', { name: 'Rites around the séance table' });
    const candle = ring.getByRole('button', { name: /^Font Failure:/ });
    await candle.click();
    await expect(candle).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByText(`${TOTAL_RITES - 1} of ${TOTAL_RITES} candles lit`)).toBeVisible();

    const ledgerItem = page.locator('#hv-ledger').getByRole('button', { name: /^Font Failure/ });
    await expect(ledgerItem).toHaveAttribute('aria-pressed', 'false');

    // and back again from the ledger
    await ledgerItem.click();
    await expect(candle).toHaveAttribute('aria-pressed', 'true');
  });

  test('quick addresses fill the address line', async ({ page }) => {
    await page.getByRole('button', { name: 'example.com' }).click();
    await expect(page.getByLabel('The house at')).toHaveValue('https://example.com');
    await expect(page.getByRole('button', { name: 'example.com' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  test('an address without a protocol keeps the planchette still', async ({ page }) => {
    await page.getByLabel('The house at').fill('example.com');
    await expect(page.getByText('Include http:// or https://')).toBeVisible();
    await expect(page.getByRole('button', { name: /Name a house/ })).toBeDisabled();
  });

  test('snuffing every candle asks for at least one', async ({ page }) => {
    await page.getByRole('button', { name: 'Snuff them all' }).click();
    await expect(page.getByText(`0 of ${TOTAL_RITES} candles lit`)).toBeVisible();
    await expect(page.getByRole('button', { name: /Light a candle/ })).toBeDisabled();
    await page.getByRole('button', { name: 'Light every candle' }).click();
    await expect(page.getByRole('button', { name: /^Begin/ })).toBeEnabled();
  });

  test('a séance runs and opens its verdict', async ({ page }) => {
    let sent: { url?: string; profiles?: string[] } = {};
    await page.route(/\/api\/test$/, async (route) => {
      sent = route.request().postDataJSON();
      await new Promise((r) => setTimeout(r, 600)); // long enough to see the running state
      await route.fulfill({ json: { success: true, report: fakeReport() } });
    });

    await page.getByRole('button', { name: 'example.com' }).click();
    await page.getByRole('button', { name: /^Begin/ }).click();
    await expect(page.getByRole('button', { name: /rite 1 of/ })).toBeVisible();

    await expect(page).toHaveURL(new RegExp(`/results/${SUMMARY.id}$`));
    expect(sent.url).toBe('https://example.com');
    expect(sent.profiles).toHaveLength(TOTAL_RITES);

    await expect(page.getByRole('heading', { level: 1, name: 'Restless.' })).toBeVisible();
    await expect(
      page.getByText('1 serious finding across 2 rites. Start with those.')
    ).toBeVisible();
  });
});

test.describe('Results — the verdict', () => {
  test.beforeEach(async ({ page }) => {
    await mockHistory(page);
    await page.route(/\/api\/test$/, (route) =>
      route.fulfill({ json: { success: true, report: fakeReport() } })
    );
    await page.goto('/');
    await page.getByRole('button', { name: /^Begin/ }).click();
    await expect(page).toHaveURL(/\/results\//);
  });

  test('findings hide call logs until opened', async ({ page }) => {
    const row = page.getByRole('button', { name: /Hero image failed to load/ });
    await expect(row).toHaveAttribute('aria-expanded', 'false');
    await expect(row).not.toContainText('Call log');
    await row.click();
    await expect(row).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('What to do')).toBeVisible();
    await expect(page.getByText(/Call log:/)).toBeVisible();
  });

  test('severity filter narrows the ledger', async ({ page }) => {
    await page
      .getByRole('group', { name: 'Filter by severity' })
      .getByRole('button', { name: /Warning/ })
      .click();
    await expect(page.getByRole('button', { name: /Low contrast text/ })).toHaveCount(2);
    await expect(page.getByRole('button', { name: /Hero image failed/ })).toHaveCount(0);
  });

  test('tabs follow the arrow keys', async ({ page }) => {
    const findingsTab = page.getByRole('tab', { name: /Findings/ });
    await findingsTab.focus();
    await page.keyboard.press('ArrowRight');
    const ritesTab = page.getByRole('tab', { name: /Rites/ });
    await expect(ritesTab).toBeFocused();
    await expect(ritesTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('heading', { level: 2, name: 'Image Failure' })).toBeVisible();
    await expect(page.getByText('No photograph survived this rite.')).toBeVisible();

    await page.keyboard.press('End');
    await expect(page.getByRole('tab', { name: /Raw data/ })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });
});

test.describe('Crypt — the graveyard', () => {
  test('an empty crypt invites a first séance', async ({ page }) => {
    await mockHistory(page, []);
    await page.goto('/crypt');
    await expect(
      page.getByRole('heading', { name: 'Nothing haunts this crypt yet' })
    ).toBeVisible();
    await page.getByRole('link', { name: 'Go to the parlour' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('a run can be kept, then banished for good', async ({ page }) => {
    await mockHistory(page, [SUMMARY]);
    await page.goto('/crypt');

    const stone = page.getByRole('article', { name: /Restless: https:\/\/example\.com/ });
    await expect(stone).toBeVisible();

    // Cancel first: the default focus lands on "Keep it"
    await stone.getByRole('button', { name: /Banish the run/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Banish this run?' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Keep it' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(stone).toBeVisible();

    // Then banish
    await stone.getByRole('button', { name: /Banish the run/ }).click();
    await dialog.getByRole('button', { name: 'Banish it' }).click();
    await expect(stone).toHaveCount(0);
    await expect(page.getByText(/Banished https:\/\/example\.com/)).toBeVisible();

    // The server still lists it, but it must not rise again
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Nothing haunts this crypt yet' })
    ).toBeVisible();
  });

  test('ledger view lists the same runs', async ({ page }) => {
    await mockHistory(page, [SUMMARY]);
    await page.goto('/crypt');
    await page.getByRole('button', { name: 'Ledger' }).click();
    await expect(page.getByRole('link', { name: SUMMARY.url })).toBeVisible();
  });
});

test.describe('Scroll — the docs', () => {
  test('renders chapters from the manual and tracks the one being read', async ({ page }) => {
    await page.goto('/docs');
    const rail = page.getByRole('navigation', { name: 'Chapters' }).last();
    await expect(rail.getByRole('link')).toHaveCount(6);
    await expect(
      page.getByRole('heading', { level: 2, name: /Connecting Your Agent/ })
    ).toBeVisible();

    await page.locator('#local-development').scrollIntoViewIfNeeded();
    await expect(rail.getByRole('link', { name: /Local Development/ })).toHaveAttribute(
      'aria-current',
      'location'
    );
  });

  test('code snippets can be copied', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/docs');
    await page
      .getByRole('button', { name: /Copy\s+bash snippet/ })
      .first()
      .click();
    await expect(page.getByRole('button', { name: /Copied\s+bash snippet/ }).first()).toBeVisible();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain('npm install -g hauntview');
  });
});

test.describe('Atmosphere & motion', () => {
  test('full atmosphere animates; reduced motion stills it', async ({ browser }) => {
    const read = async (reducedMotion: 'reduce' | 'no-preference') => {
      const ctx = await browser.newContext({ reducedMotion });
      const page = await ctx.newPage();
      await mockHistory(page);
      await page.goto('/');
      await page.mouse.move(400, 300);
      const state = await page.evaluate(() => ({
        grain: getComputedStyle(document.querySelector('.hv-grain')!).animationName,
        lantern: getComputedStyle(document.querySelector('.hv-lantern-light')!).display,
        glitch: getComputedStyle(document.querySelector('.hv-glitch')!, '::before').display,
      }));
      await ctx.close();
      return state;
    };

    const full = await read('no-preference');
    expect(full.grain).toBe('hv-grain');
    expect(full.lantern).not.toBe('none');

    const still = await read('reduce');
    expect(still.grain).toBe('none');
    expect(still.lantern).toBe('none');
    expect(still.glitch).toBe('none');
  });

  test('glitch copies are hidden from assistive tech', async ({ page }) => {
    await mockHistory(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'Who haunts your website?'
    );
    await expect(page.getByRole('link', { name: 'HauntView home' })).toBeVisible();
  });
});

test.describe('Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  for (const path of ['/', '/crypt', '/docs']) {
    test(`${path} fits the phone and uses the bottom door-bar`, async ({ page }) => {
      await mockHistory(page, [SUMMARY]);
      await page.goto(path);
      const doorbar = page.getByRole('navigation', { name: 'Primary' }).last();
      await expect(doorbar).toBeVisible();
      await expect(doorbar.getByRole('link')).toHaveCount(3);
      await expectNoHorizontalScroll(page);
    });
  }

  test('the ledger opens on demand', async ({ page }) => {
    await mockHistory(page);
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Show list' });
    await expect(page.locator('#hv-ledger')).toBeHidden();
    await toggle.click();
    await expect(page.locator('#hv-ledger')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hide list' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });
});

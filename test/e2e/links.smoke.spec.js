const { test, expect } = require('./fixtures');

// Uses a stable public workflow file. Update this URL if the file moves.
const TARGET = 'https://github.com/actions/checkout/blob/main/.github/workflows/test.yml';

test('injects repo-link affordances on a workflow page', async ({ page }) => {
  await page.goto(TARGET, { waitUntil: 'domcontentloaded' });

  // Give the extension time to fetch raw YAML and inject links
  await expect(page.locator('.gha-action-link').first()).toBeAttached({ timeout: 10_000 });

  const href = await page.locator('.gha-action-link').first().getAttribute('href');
  expect(href).toMatch(/^https:\/\/github\.com\//);
});

test('does not inject affordances on a non-workflow blob page', async ({ page }) => {
  await page.goto('https://github.com/actions/checkout/blob/main/README.md', {
    waitUntil: 'domcontentloaded',
  });
  // Wait a moment for the extension to have run (it should be a no-op here)
  await page.waitForTimeout(5000);
  const count = await page.locator('.gha-action-link').count();
  expect(count).toBe(0);
});

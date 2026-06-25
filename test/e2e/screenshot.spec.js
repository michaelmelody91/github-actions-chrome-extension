const { test } = require('./fixtures');
const path = require('path');

const TARGET = 'https://github.com/actions/checkout/blob/main/.github/workflows/test.yml';
const OUT = path.resolve(__dirname, '../../test-screenshot.png');

test('screenshot workflow page with extension active', async ({ page }) => {
  await page.goto(TARGET, { waitUntil: 'domcontentloaded' });
  await page.locator('.gha-action-link').first().waitFor({ timeout: 10_000 });
  await page.locator('.gha-action-link').first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: OUT });
});

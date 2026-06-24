const { test, expect } = require('./fixtures');
const ACTION_CTA_PADDING_RIGHT = 28;

// Uses a stable public workflow file. Update this URL if the file moves.
const TARGET = 'https://github.com/actions/checkout/blob/main/.github/workflows/test.yml';

test('injects repo-link affordances on a workflow page', async ({ page }) => {
  await page.goto(TARGET, { waitUntil: 'domcontentloaded' });

  // Give the extension time to fetch raw YAML and inject links
  const link = page.locator('.gha-action-link').first();
  await expect(link).toBeAttached({ timeout: 10_000 });

  const href = await link.getAttribute('href');
  expect(href).toMatch(/^https:\/\/github\.com\//);

  const metrics = await link.evaluate((el) => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const parentStyle = getComputedStyle(el.parentElement);

    return {
      opacity: Number(style.opacity),
      position: style.position,
      width: rect.width,
      height: rect.height,
      parentPosition: parentStyle.position,
      parentPaddingRight: parentStyle.paddingRight,
    };
  });

  expect(metrics.position).toBe('absolute');
  expect(metrics.opacity).toBeGreaterThanOrEqual(0.5);
  expect(metrics.width).toBeGreaterThanOrEqual(14);
  expect(metrics.height).toBeGreaterThanOrEqual(14);
  expect(metrics.parentPosition).not.toBe('static');
  expect(parseFloat(metrics.parentPaddingRight)).toBeGreaterThanOrEqual(ACTION_CTA_PADDING_RIGHT);
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

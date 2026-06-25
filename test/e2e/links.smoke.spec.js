const { test, expect } = require('./fixtures');

// Uses a stable public workflow file. Update this URL if the file moves.
const TARGET = 'https://github.com/actions/checkout/blob/main/.github/workflows/test.yml';

test('injects repo-link affordances on a workflow page', async ({ page }) => {
  await page.goto(TARGET, { waitUntil: 'domcontentloaded' });

  // Give the extension time to fetch raw YAML and inject links
  const actionLink = page.locator('.gha-action-link').first();
  await expect(actionLink).toBeAttached({ timeout: 10_000 });

  const href = await actionLink.getAttribute('href');
  expect(href).toMatch(/^https:\/\/github\.com\//);

  await expect(actionLink).toBeAttached({ timeout: 10_000 });

  const lineCell = actionLink.locator('xpath=ancestor-or-self::*[@data-line-number][1]');
  await lineCell.scrollIntoViewIfNeeded();

  const lineNumber = await lineCell.getAttribute('data-line-number');
  const lineBox = await visibleLineBox(page, Number(lineNumber));
  const prevBox = await visibleLineBox(page, Number(lineNumber) - 1);
  const nextBox = await visibleLineBox(page, Number(lineNumber) + 1);
  const linkBox = await actionLink.boundingBox();

  expect(lineNumber).toBeTruthy();
  expect(lineBox && linkBox).toBeTruthy();
  expect(linkBox.x).toBeGreaterThan(lineBox.x + lineBox.width + 1);
  if (prevBox && nextBox) {
    expect(Math.abs(lineBox.x - prevBox.x)).toBeLessThan(1);
    expect(Math.abs(lineBox.x - nextBox.x)).toBeLessThan(1);
  }
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

async function visibleLineBox(page, lineNumber) {
  if (lineNumber <= 0) return null;

  return page.evaluate((n) => {
    const nodes = Array.from(document.querySelectorAll('[data-line-number="' + n + '"]'));
    const node = nodes.find((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    };
  }, lineNumber);
}

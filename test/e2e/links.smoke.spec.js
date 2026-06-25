const { test, expect } = require('./fixtures');

// Uses a stable public workflow file. Update this URL if the file moves.
const TARGET = 'https://github.com/actions/checkout/blob/main/.github/workflows/test.yml';
const MIN_SPACING_PX = 2; // Keep a visible gap between the number and CTA.
const VERTICAL_ALIGN_TOLERANCE_PX = 8; // Allow for sub-pixel rendering differences.

test('injects repo-link affordances on a workflow page', async ({ page }) => {
  await page.goto(TARGET, { waitUntil: 'domcontentloaded' });

  // Give the extension time to fetch raw YAML and inject links
  await expect(page.locator('.gha-action-link').first()).toBeAttached({ timeout: 10_000 });

  const href = await page.locator('.gha-action-link').first().getAttribute('href');
  expect(href).toMatch(/^https:\/\/github\.com\//);
});

test('places the CTA beside the line number', async ({ page }) => {
  await page.goto(TARGET, { waitUntil: 'domcontentloaded' });

  const link = page.locator('.gha-action-link').first();
  const cell = link.locator('xpath=..');
  const lineNumber = cell.locator('.gha-line-number');

  await expect(cell).toBeVisible({ timeout: 10_000 });
  await expect(lineNumber).toBeVisible();
  await expect(link).toBeVisible();

  const [numberBox, linkBox] = await Promise.all([lineNumber.boundingBox(), link.boundingBox()]);
  expect(numberBox).not.toBeNull();
  expect(linkBox).not.toBeNull();
  expect(linkBox.x).toBeGreaterThan(numberBox.x + numberBox.width + MIN_SPACING_PX);
  expect(Math.abs(linkBox.y - numberBox.y)).toBeLessThan(VERTICAL_ALIGN_TOLERANCE_PX);

  const lineNumberValue = Number((await lineNumber.textContent()).trim());
  const neighborBoxes = await Promise.all(
    [lineNumberValue - 1, lineNumberValue + 1].map((n) =>
      page.locator(`[data-line-number="${n}"]`).first().boundingBox()
    )
  );
  neighborBoxes.forEach((box) => expect(box).not.toBeNull());
  neighborBoxes.forEach((box) => {
    expect(Math.abs(box.x - numberBox.x)).toBeLessThanOrEqual(2);
  });
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

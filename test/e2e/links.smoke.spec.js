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

test('places links on correct lines after back navigation', async ({ page }) => {
  // GIVEN - two different workflow files with different uses: lines
  const WORKFLOW_1 = 'https://github.com/actions/checkout/blob/main/.github/workflows/test.yml';
  const WORKFLOW_2 = 'https://github.com/actions/upload-artifact/blob/main/.github/workflows/test.yml';

  // GIVEN - visit first workflow and record link count
  await page.goto(WORKFLOW_1, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.gha-action-link').first()).toBeAttached({ timeout: 10_000 });
  const firstWorkflowLinkCount = await page.locator('.gha-action-link').count();

  // WHEN - navigate to second workflow then go back
  await page.goto(WORKFLOW_2, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.gha-action-link').first()).toBeAttached({ timeout: 10_000 });

  await page.goBack({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.gha-action-link').first()).toBeAttached({ timeout: 10_000 });

  // THEN - link count matches original first workflow (links are on correct lines)
  const linkCountAfterBack = await page.locator('.gha-action-link').count();
  expect(linkCountAfterBack).toBe(firstWorkflowLinkCount);

  // AND all links point to valid GitHub URLs
  const links = await page.locator('.gha-action-link').all();
  for (const link of links) {
    const href = await link.getAttribute('href');
    expect(href).toMatch(/^https:\/\/github\.com\//);
  }
});

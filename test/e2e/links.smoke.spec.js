const { test, expect } = require('./fixtures');

// Uses a stable public workflow file. Update this URL if the file moves.
const TARGET = 'https://github.com/actions/checkout/blob/main/.github/workflows/test.yml';

test('injects repo-link affordances on a workflow page', async ({ page }) => {
  await page.goto(TARGET, { waitUntil: 'domcontentloaded' });

  // Give the extension time to fetch raw YAML and inject links
  await expect(page.locator('.gha-action-link').first()).toBeAttached({ timeout: 10_000 });

  const linkLocator = page.locator('.gha-action-link').first();
  const href = await linkLocator.getAttribute('href');
  expect(href).toMatch(/^https:\/\/github\.com\//);

  const metrics = await page.evaluate(() => {
    const firstLink = document.querySelector('.gha-action-link');
    if (!firstLink) throw new Error('Missing CTA link');

    function findLineCell(lineNumber) {
      return document.querySelector(`[data-line-number="${lineNumber}"], #L${lineNumber}`);
    }

    function findLineCellAncestorOrQuery(lineNumber, startNode) {
      let node = startNode;
      while (node) {
        if (
          node.getAttribute &&
          (node.getAttribute('data-line-number') === String(lineNumber) || node.id === `L${lineNumber}`)
        ) {
          return node;
        }
        node = node.parentElement;
      }
      return findLineCell(lineNumber);
    }

    function getElementXAndWidth(el) {
      const rect = el.getBoundingClientRect();
      return { x: rect.x, width: rect.width };
    }

    // These line numbers come from actions/checkout's test workflow around the injected uses: line.
    const line17 = findLineCellAncestorOrQuery(17, firstLink);
    const line15 = findLineCell(15);
    const line16 = findLineCell(16);
    const line18 = findLineCell(18);

    if (!line15 || !line16 || !line17 || !line18) {
      throw new Error('Missing line number cells around CTA');
    }

    return {
      box15: getElementXAndWidth(line15),
      box16: getElementXAndWidth(line16),
      box17: getElementXAndWidth(line17),
      box18: getElementXAndWidth(line18),
      linkBox: getElementXAndWidth(firstLink),
    };
  });

  // Allow a 1px variance for browser rendering differences while checking vertical alignment.
  expect(Math.abs(metrics.box15.x - metrics.box16.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(metrics.box16.x - metrics.box17.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(metrics.box17.x - metrics.box18.x)).toBeLessThanOrEqual(1);
  expect(metrics.linkBox.x).toBeGreaterThan(metrics.box17.x + metrics.box17.width);
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

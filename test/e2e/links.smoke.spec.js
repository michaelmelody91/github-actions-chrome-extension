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

    function findLine(lineNumber) {
      return document.querySelector('[data-line-number="' + lineNumber + '"], #L' + lineNumber);
    }

    function measure(el) {
      const rect = el.getBoundingClientRect();
      return { x: rect.x, width: rect.width };
    }

    const line17 =
      (function () {
        let node = firstLink;
        while (node) {
          if (
            node.getAttribute &&
            (node.getAttribute('data-line-number') === '17' || node.id === 'L17')
          ) {
            return node;
          }
          node = node.parentElement;
        }
        return null;
      })() || findLine(17);

    const line15 = findLine(15);
    const line16 = findLine(16);
    const line18 = findLine(18);

    if (!line15 || !line16 || !line17 || !line18) {
      throw new Error('Missing line number cells around CTA');
    }

    return {
      box15: measure(line15),
      box16: measure(line16),
      box17: measure(line17),
      box18: measure(line18),
      linkBox: measure(firstLink),
    };
  });

  expect(metrics.box15.x).toBeCloseTo(metrics.box16.x, 1);
  expect(metrics.box16.x).toBeCloseTo(metrics.box17.x, 1);
  expect(metrics.box17.x).toBeCloseTo(metrics.box18.x, 1);
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

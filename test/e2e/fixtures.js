const { test: base, chromium } = require('@playwright/test');
const path = require('path');

const extensionPath = path.resolve(__dirname, '../..');
const headless = process.env.PWHEADLESS !== 'false';

exports.test = base.extend({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        ...(headless ? ['--headless=new'] : []),
      ],
    });
    await use(context);
    await context.close();
  },
  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
  },
});

exports.expect = require('@playwright/test').expect;

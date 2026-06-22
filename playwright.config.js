const path = require('path');
const { defineConfig } = require('@playwright/test');

const extensionPath = path.resolve(__dirname);

module.exports = defineConfig({
  testDir: './test/e2e',
  timeout: 30_000,
  use: {
    browserName: 'chromium',
    // Extensions require a non-headless context in older Chrome; --headless=new
    // (Chrome 112+) supports them. Set PWHEADLESS=false to watch locally.
    headless: process.env.PWHEADLESS !== 'false',
    launchOptions: {
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--headless=new',
      ],
    },
  },
});

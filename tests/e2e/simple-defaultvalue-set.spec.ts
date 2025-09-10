import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const basePath = path.resolve(__dirname, '..', 'fixtures');
const baseURL = pathToFileURL(basePath).href + '/';

test.use({
  baseURL
});

test.describe('CSV Mapper allowMultipleSelection tests', () => {
  test.use({
    baseURL
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('mapping-required-with-default-value.html');
    await expect(page).toHaveTitle(/CSV Mapper - Default value mapping test/);
  });

  test('Test mapping to multiple of the same column produces specified output', async ({ page }) => {
    await expect(page.locator('#is-result-okay')).toContainText('Yes', { timeout: 500 });
  });
});

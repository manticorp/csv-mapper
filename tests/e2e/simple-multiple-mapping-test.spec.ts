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
    await page.goto('many-to-many-mapping.html');
    await expect(page).toHaveTitle(/CSV Mapper - Many-to-Many Mapping Demo/);
  });

  test('Test mapping to multiple of the same column produces specified output', async ({ page }) => {
    await expect(page.locator('#input-csv')).toContainText(`sku,title,active,categorya,categoryb1,Product A,true,Category 1,Category 22,Product B,false,Category 1,Category 33,Product C,true,Category 3`);
    await expect(page.locator('#csv-result')).toContainText('id,name,active,category,category1,Product A,true,Category 1,Category 22,Product B,false,Category 1,Category 33,Product C,true,Category 3,');
    await expect(page.locator('#is-result-okay')).toContainText('Yes');
  });
});

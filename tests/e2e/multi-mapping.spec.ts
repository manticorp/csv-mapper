import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const basePath = path.resolve(__dirname, '..', 'fixtures');
const baseURL = pathToFileURL(basePath).href + '/';

test.use({
  baseURL
});

test.describe('CSV Mapper multi mapping tests', () => {
  test.use({
    baseURL
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('multiple-selection.html');
    await expect(page).toHaveTitle(/CSV Mapper/);
  });

  test('Test multi mapping modes allows selecting CSV column twice', async ({ page }) => {
    const csvContent = `Product Id,Name,Price,Cat,Qty
1,Simple Product,19.99,Category A,100
2,Another Product,29.99,Category B,50`;

    // Upload CSV content as file
    const fileInput = page.locator('#csvFile1');
    await fileInput.setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });
    await page.locator('#controls1 select[name="Cat"]').selectOption('category');
    await expect(page.locator('#controls1 select[name="Cat"]')).toHaveValue('category');

    // Switch to configToCsv mode
    await page.locator('#switchMode1').click();
    await page.locator('#controls1 select[name="stock"]').selectOption('Cat', {timeout: 500});
    await expect(page.locator('#controls1 select[name="stock"]')).toHaveValue('Cat', {timeout: 500});

    // Switch back to csvToConfig mode
    await page.locator('#switchMode1').click();
    await page.locator('#controls1 select[name="Cat"]').selectOption('category');
    await expect(page.locator('#controls1 select[name="Cat"]')).toHaveValue('category');
  });

  test('Test multi mapping does not deselect other fields', async ({ page }) => {
    const csvContent = `Product Id,Name,Price,Cat,Qty
1,Simple Product,19.99,Category A,100
2,Another Product,29.99,Category B,50`;

    // Upload CSV content as file
    const fileInput = page.locator('#csvFile1');
    await fileInput.setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // Switch to configToCsv mode
    await page.locator('#switchMode1').click();
    await page.locator('#controls1 [name="category"]').selectOption('Cat');
    await page.locator('#controls1 [name="stock"]').selectOption('Cat');
    await page.locator('#controls1 [name="stock"]').selectOption('');
    await expect(page.locator('#controls1 [name="category"]')).toHaveValue('Cat');
    await expect(page.locator('#controls1 [name="stock"]')).toHaveValue('');
  });
});

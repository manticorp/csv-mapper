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
    await page.goto('multiple-selection.html');
    await expect(page).toHaveTitle(/Multiple Selection Demo/);
  });

  test('Test allowMultipleSelection: true enables multi-select in csvToConfig mode', async ({ page }) => {
    const csvContent = `product_id,name,price,category,stock
1,Laptop Computer,999.99,Electronics,5
2,Office Chair,199.99,Furniture,12`;

    // Upload CSV to demo 1 (multiple selection enabled)
    const fileInput1 = page.locator('#csvFile1');
    await fileInput1.setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    for (const field of ['product_id', 'name', 'price', 'category', 'stock']) {
      await expect(page.locator(`#controls1 select[name="${field}"]`)).toBeVisible();
      await expect(page.locator(`#controls1 select[name="${field}"]`)).toHaveAttribute('multiple');
    }
  });

  test('Test allowMultipleSelection: false uses single select in csvToConfig mode', async ({ page }) => {
    const csvContent = `product_id,name,price,category,stock
1,Laptop Computer,999.99,Electronics,5
2,Office Chair,199.99,Furniture,12`;

    // Upload CSV to demo 1 (multiple selection disabled)
    const fileInput1 = page.locator('#csvFile2');
    await fileInput1.setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    for (const field of ['product_id', 'name', 'price', 'category', 'stock']) {
      await expect(page.locator(`#controls2 select[name="${field}"]`)).toBeVisible();
      await expect(page.locator(`#controls2 select[name="${field}"]`)).not.toHaveAttribute('multiple');
    }
  });

  test('Test allowMultipleSelection: true allows duplicate CSV headers in configToCsv mode', async ({ page }) => {
    const csvContent = `product_id,name,price,category,stock
1,Laptop Computer,999.99,Electronics,5
2,Office Chair,199.99,Furniture,12`;

    // Upload CSV to demo 1 (multiple selection enabled)
    const fileInput1 = page.locator('#csvFile1');
    await fileInput1.setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // Switch to configToCsv mode
    await page.locator('#switchMode1').click();
    await expect(page.locator('#currentMode1')).toHaveText('Config → CSV');

    // Map both category and stock to the same CSV header "category"
    await page.locator('#controls1 select[name="category"]').selectOption('category', {timeout: 500});
    await page.locator('#controls1 select[name="stock"]').selectOption('category', {timeout: 500});

    // Verify both are mapped to "category"
    await expect(page.locator('#controls1 select[name="category"]')).toHaveValue('category', {timeout: 500});
    await expect(page.locator('#controls1 select[name="stock"]')).toHaveValue('category', {timeout: 500});
  });

  test('Test allowMultipleSelection: false prevents duplicate CSV headers in configToCsv mode', async ({ page }) => {
    const csvContent = `product_id,name,price,category,stock
1,Laptop Computer,999.99,Electronics,5
2,Office Chair,199.99,Furniture,12`;

    // Upload CSV to demo 2 (multiple selection disabled)
    const fileInput2 = page.locator('#csvFile2');
    await fileInput2.setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // Switch to configToCsv mode
    await page.locator('#switchMode2').click();
    await expect(page.locator('#currentMode2')).toHaveText('Config → CSV');

    // Map category to "category"
    await page.locator('#controls2 select[name="category"]').selectOption('category');
    await expect(page.locator('#controls2 select[name="category"]')).toHaveValue('category');

    // Try to map stock to "category" - should be disabled
    const stockSelect = page.locator('#controls2 select[name="stock"]');
    const categoryOption = stockSelect.locator('option[value="category"]');
    await expect(categoryOption).not.toHaveAttribute('disabled');
    const stockOption = stockSelect.locator('option[value="stock"]');
    await expect(stockOption).not.toHaveAttribute('disabled');
  });

  test('Test toggling allowMultipleSelection updates behavior', async ({ page }) => {
    const csvContent = `Product Id,Name,Price,category,Stock
1,Laptop Computer,999.99,Electronics,5`;

    // Upload CSV to demo 1
    const fileInput1 = page.locator('#csvFile1');
    await fileInput1.setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // Initially multiple selection is enabled
    await expect(page.locator('#controls1 select[name="Product-Id"]')).toHaveAttribute('multiple', {timeout: 500});

    // Disable multiple selection
    await page.locator('#multipleMode1').uncheck();

    // Check that multiple attribute is removed
    await expect(page.locator('#controls1 select[name="Product-Id"]')).not.toHaveAttribute('multiple', {timeout: 500});

    // Re-enable multiple selection
    await page.locator('#multipleMode1').check();

    // Check that multiple attribute is restored
    await expect(page.locator('#controls1 select[name="Product-Id"]')).toHaveAttribute('multiple', {timeout: 500});
  });

  test('Test deselecting in multiple selection mode with configToCsv', async ({ page }) => {
    const csvContent = `Product Id,Name,Price,Category,Stock
1,Laptop Computer,999.99,Electronics,5`;

    // Upload CSV to demo 1 (multiple selection enabled)
    const fileInput1 = page.locator('#csvFile1');
    await fileInput1.setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // Switch to configToCsv mode
    await page.locator('#switchMode1').click();

    // Map both category and stock to the same CSV header
    await page.locator('#controls1 select[name="category"]').selectOption('Category');
    await page.locator('#controls1 select[name="stock"]').selectOption('Category');

    // Deselect stock
    await page.locator('#controls1 select[name="stock"]').selectOption('');

    // Category should still be mapped, stock should be deselected
    await expect(page.locator('#controls1 select[name="category"]')).toHaveValue('Category');
    await expect(page.locator('#controls1 select[name="stock"]')).toHaveValue('');
  });
});

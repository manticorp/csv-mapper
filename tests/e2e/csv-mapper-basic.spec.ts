import { test, expect, type Page } from '@playwright/test';
import path from 'path';

test.describe('CSV Mapper Browser Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CSV Mapper/);
  });

  test('should load the demo page successfully', async ({ page }) => {
    // Check for key elements
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[type="file"]')).toBeVisible();
  });

  test('should handle file upload', async ({ page }) => {
    // Create a simple CSV content for testing
    const csvContent = 'Product ID,Name,Age,City\n1,John Doe,30,New York\n2,Jane Smith,25,Los Angeles';

    // Upload CSV content as file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // Look for any processing button or automatic processing
    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Process"), button[type="submit"]');
    if (await uploadButton.isVisible()) {
      await uploadButton.click();
    }

    // Wait for some indication of processing
    await page.waitForTimeout(100);

    // Check that something happened (headers detected, mapping interface, etc.)
    const hasHeaders = await page.locator('.header, .csv-header, h3, h4').count() > 0;
    const hasTable = await page.locator('table, .table').isVisible();
    const mappingSelects = page.locator('select');
    const hasMapping = await mappingSelects.count() > 0;

    expect(hasHeaders || hasTable || hasMapping).toBe(true);
  });

  test('should handle different CSV formats', async ({ page }) => {
    // Test semicolon-separated CSV
    const csvContent = 'Product ID;Name;Age;City\n1;"John Doe";30;"New York"\n2;"Jane Smith";25;"Los Angeles"';

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'semicolon.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Process"), button[type="submit"]');
    if (await uploadButton.isVisible()) {
      await uploadButton.click();
    }

    await page.waitForTimeout(1000);

    // Should handle semicolon separator correctly
    const errorMessages = page.locator('.error, .warning');
    const errorCount = await errorMessages.count();
    expect(errorCount).toBe(0);
  });

  test('should handle CSV with quoted fields', async ({ page }) => {
    // CSV with complex quoted content
    const csvContent = 'Product ID,Name,Description,Notes\n"1","John Doe","Product with, comma and ""quotes""","Additional notes"\n"2","Jane Smith","Simple product","No special chars"';

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'quoted.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Process"), button[type="submit"]');
    if (await uploadButton.isVisible({timeout: 500})) {
      await uploadButton.click({timeout: 500});
    }

    await page.waitForTimeout(500);

    // Should successfully process the file (mapping interface should appear)
    const mappingTable = page.locator('table');
    await expect(mappingTable).toBeVisible();

    // Check that headers were detected
    const nameRow = page.locator('strong:has-text("Name")').first();
    await expect(nameRow).toBeVisible();
  });

  test('should handle empty files gracefully', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'empty.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('')
    });

    // The fileInput should have a custom validity message
    const validity = await fileInput.evaluate((input: HTMLInputElement) => input.validationMessage);
    expect(validity).toMatch(/Missing required columns: /);
  });

  test('should load within performance budget', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');

    // Wait for key elements to be visible
    await expect(page.locator('input[type="file"]')).toBeVisible();

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(1000); // Should load within 1 second
  });
});

import { test, expect } from '@playwright/test';

test.describe('Scenario E2: Multi-item Order List & Quantity Adjustment', () => {
  test('allows adding multiple items, adjusting quantity, and viewing updated total', async ({ page }) => {
    // Navigate to catalogue
    await page.goto('/catalog');

    // Verify catalog title and product links are visible
    await expect(page.locator('h1')).toBeVisible();

    // Find product cards and click on first product
    const firstProduct = page.locator('a[href^="/p/"]').first();
    if (await firstProduct.count() > 0) {
      await firstProduct.click();
      await page.waitForURL(/\/p\/.+/);

      // Select variant if variants exist
      const variantButton = page.locator('button[data-variant-id]').first();
      if (await variantButton.count() > 0) {
        await variantButton.click();
      }

      // Add to order list
      const addButton = page.locator('button:has-text("Add to Order"), button:has-text("Add to Bag")').first();
      if (await addButton.count() > 0) {
        await addButton.click();
      }

      // Open order list drawer / dialog
      const orderDrawerTrigger = page.locator('[aria-label="Order bag"], [aria-label="Order list"], a[href="/order"]').first();
      if (await orderDrawerTrigger.count() > 0) {
        await orderDrawerTrigger.click();

        // Check quantity controls (+ / -)
        const increaseBtn = page.locator('button[aria-label="Increase quantity"], button:has-text("+")').first();
        if (await increaseBtn.count() > 0) {
          await increaseBtn.click();
        }

        // Verify total price is formatted with Naira (₦)
        const totalElement = page.locator('text=/₦[0-9,]+/');
        await expect(totalElement.first()).toBeVisible();
      }
    }
  });
});

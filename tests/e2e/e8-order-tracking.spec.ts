import { test, expect } from '@playwright/test';

test.describe('Scenario E8: Public Order Tracking', () => {
  test('renders tracking lookup form and accepts order ID and phone', async ({ page }) => {
    await page.goto('/track');

    // Verify form elements exist
    await expect(page.locator('h1')).toContainText(/Track/i);
    const orderIdInput = page.locator('input[name="orderId"], input[placeholder*="KRN"]');
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]');
    const submitBtn = page.locator('button[type="submit"]');

    await expect(orderIdInput).toBeVisible();
    await expect(phoneInput).toBeVisible();
    await expect(submitBtn).toBeVisible();
  });

  test('pre-fills order ID from query parameter (?id=)', async ({ page }) => {
    const testOrderId = 'KRN-261013-AB12C';
    await page.goto(`/track?id=${testOrderId}`);

    const orderIdInput = page.locator('input[name="orderId"], input[placeholder*="KRN"]');
    await expect(orderIdInput).toHaveValue(testOrderId);
  });

  test('displays generic security error when order ID or phone does not match', async ({ page }) => {
    await page.goto('/track');

    const orderIdInput = page.locator('input[name="orderId"], input[placeholder*="KRN"]');
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]');
    const submitBtn = page.locator('button[type="submit"]');

    await orderIdInput.fill('KRN-999999-NONEXIST');
    await phoneInput.fill('08012345678');
    await submitBtn.click();

    // Blueprint requirement §12.3: Generic error for any mismatch
    // Should display neutral message without revealing whether order ID exists
    const errorNotice = page.locator('text=/Order not found or details do not match/i, [role="alert"]');
    await expect(errorNotice.first()).toBeVisible({ timeout: 5000 });
  });
});

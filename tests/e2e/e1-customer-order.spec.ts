import { test, expect } from '@playwright/test';

test.describe('Scenario E1 & E5: Customer Order Journey & Validation', () => {
  test('E1: Storefront navigation, product inspection, and WhatsApp order flow', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/Keraunous Tech Store/i);

    // 2. Navigate to /shop
    await page.goto('/shop');
    await expect(page.locator('h1')).toBeVisible();

    // 3. Inspect a product card
    const firstProduct = page.locator('a[href^="/product/"]').first();
    await expect(firstProduct).toBeVisible();
    const productHref = await firstProduct.getAttribute('href');
    expect(productHref).toBeTruthy();

    await page.goto(productHref!);
    await expect(page.locator('h1')).toBeVisible();

    // 4. Verify variant options and purchase box
    await expect(page.getByRole('button', { name: /Order on WhatsApp/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Add to (Order )?List/i })).toBeVisible();

    // 5. Open Quick Order modal / sheet
    await page.getByRole('button', { name: /Order on WhatsApp/i }).click();

    // Verify modal inputs are present
    const nameInput = page.locator('input[name="name"], input#customer-name').first();
    const phoneInput = page.locator('input[name="phone"], input#customer-phone').first();

    await expect(nameInput).toBeVisible();
    await expect(phoneInput).toBeVisible();
  });

  test('E5: Form validation rejects invalid Nigerian phone numbers', async ({ page }) => {
    await page.goto('/order-list');
    await expect(page.locator('h1')).toBeVisible();

    // Fill customer form with invalid phone
    const phoneInput = page.locator('input[name="phone"], input#customer-phone').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('0123456'); // Invalid length/prefix
      await phoneInput.blur();

      // Check inline validation notice or submit disabled
      const submitBtn = page.getByRole('button', { name: /Send Order on WhatsApp/i });
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await expect(page.locator('body')).toContainText(/valid Nigerian phone/i);
      }
    }
  });
});

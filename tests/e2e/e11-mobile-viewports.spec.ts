import { test, expect } from '@playwright/test';

const MOBILE_VIEWPORTS = [
  { width: 360, height: 640, name: 'Small Android (360x640)' },
  { width: 390, height: 844, name: 'iPhone 14 (390x844)' },
];

test.describe('Scenario E11: Mobile Responsiveness & Viewport Integrity', () => {
  for (const vp of MOBILE_VIEWPORTS) {
    test(`has no horizontal overflow at ${vp.name} on Home, Catalog, and Track`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      const paths = ['/', '/catalog', '/track'];
      for (const path of paths) {
        await page.goto(path);
        await page.waitForLoadState('domcontentloaded');

        // Verify document body does not overflow horizontally
        const isOverflowing = await page.evaluate(() => {
          const doc = document.documentElement;
          return doc.scrollWidth > window.innerWidth;
        });

        expect(isOverflowing, `Page ${path} should not overflow horizontally at width ${vp.width}`).toBe(false);
      }
    });

    test(`renders accessible mobile header navigation at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Verify brand logo or store title exists
      const brand = page.locator('header a:has-text("Keraunous")');
      await expect(brand.first()).toBeVisible();

      // Verify mobile search or navigation links are accessible
      const navLinks = page.locator('header nav, header button, header a');
      await expect(navLinks.first()).toBeVisible();
    });
  }
});

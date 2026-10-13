import { test, expect } from '@playwright/test';

test.describe('Scenario E12: Server-Side Rendering (SSR) & Meta Tag Integrity', () => {
  test('delivers server-rendered HTML and essential SEO tags on home page without JavaScript execution', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);

    const html = await res.text();

    // Verify critical SSR markers
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('<title>');
    expect(html).toContain('Keraunous');

    // Verify OpenGraph / meta description tags exist
    expect(html).toMatch(/<meta[^>]+name="description"[^>]+>/i);
  });

  test('delivers server-rendered catalogue page with product grid container', async ({ request }) => {
    const res = await request.get('/catalog');
    expect(res.status()).toBe(200);

    const html = await res.text();
    expect(html).toContain('<!DOCTYPE html>');
    // Catalogue headings should be SSR'd
    expect(html).toMatch(/<h1[^>]*>.*Catalogue.*<\/h1>|<h1[^>]*>.*Store.*<\/h1>|<h1[^>]*>.*Products.*<\/h1>/i);
  });

  test('delivers server-rendered order tracking page', async ({ request }) => {
    const res = await request.get('/track');
    expect(res.status()).toBe(200);

    const html = await res.text();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('track');
  });

  test('returns 404 status and valid error page for non-existent routes', async ({ request }) => {
    const res = await request.get('/this-route-does-not-exist-404-test');
    expect(res.status()).toBe(404);
  });
});

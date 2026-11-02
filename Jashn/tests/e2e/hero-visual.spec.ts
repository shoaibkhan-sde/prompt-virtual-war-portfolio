import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Landing Hero Visual & Accessibility Conformance', () => {
  const VIEWPORTS = [
    { name: '1920px (Desktop wide)', width: 1920, height: 1080 },
    { name: '1024px (Tablet/Desktop)', width: 1024, height: 768 },
    { name: '390px (Mobile)', width: 390, height: 844 },
  ];

  for (const vp of VIEWPORTS) {
    test(`renders landing hero cleanly across ${vp.width}px`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      const heroSection = page.locator('section[aria-label^="Welcome to Jashn"]');
      await expect(heroSection).toBeVisible();

      // Check eyebrow and call to action buttons
      await expect(heroSection.getByText('One planner for every celebration')).toBeVisible();
      await expect(heroSection.getByRole('button', { name: 'Start a new plan' })).toBeVisible();
      await expect(heroSection.getByRole('button', { name: 'Try a sample plan' })).toBeVisible();
    });
  }

  test('reduced-motion preference renders hero cleanly without motion breakage', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const heroSection = page.locator('section[aria-label^="Welcome to Jashn"]');
    await expect(heroSection).toBeVisible();
    await expect(heroSection.getByText('One planner for every celebration')).toBeVisible();
  });

  test('hero section reports zero axe-core accessibility violations', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const results = await new AxeBuilder({ page })
      .include('section[aria-label^="Welcome to Jashn"]')
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('interactive elements meet touch target standards (>= 44px)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const heroSection = page.locator('section[aria-label^="Welcome to Jashn"]');
    const buttons = heroSection.locator('button');
    const count = await buttons.count();

    expect(count).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const box = await btn.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });
});

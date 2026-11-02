import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Navbar Visual, Responsive & Accessibility Conformance', () => {
  const VIEWPORTS = [
    { name: '1920px (Desktop wide)', width: 1920, height: 1080 },
    { name: '1024px (Tablet/Desktop)', width: 1024, height: 768 },
    { name: '390px (Mobile)', width: 390, height: 844 },
  ];

  for (const vp of VIEWPORTS) {
    test(`renders correctly at ${vp.width}px with menu closed`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      const header = page.locator('header').first();
      await expect(header).toBeVisible();

      // Check brand logo and wordmark
      await expect(header.getByText('Jashn')).toBeVisible();

      // Check desktop nav links
      if (vp.width > 820) {
        const homeLink = header.getByRole('link', { name: 'Home', exact: true });
        await expect(homeLink).toBeVisible();
      }

      // Check theme toggle button
      const themeBtn = header.getByRole('button', { name: /Switch to (dark|light) mode/i });
      await expect(themeBtn).toBeVisible();
    });
  }

  test('reports zero axe-core accessibility violations in header', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const results = await new AxeBuilder({ page })
      .include('header')
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('mobile navigation panel toggles below 820px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const header = page.locator('header').first();
    const toggleBtn = header.getByRole('button', { name: /navigation menu/i });
    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');

    // Open mobile menu
    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');

    const mobilePanel = header.locator('#mobile-nav-panel');
    await expect(mobilePanel).toBeVisible();
    await expect(mobilePanel.getByRole('link', { name: 'Home', exact: true })).toBeVisible();

    // Close mobile menu
    await toggleBtn.click();
    await expect(mobilePanel).not.toBeVisible();
  });
});

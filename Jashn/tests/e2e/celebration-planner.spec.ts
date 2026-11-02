import { test, expect } from '@playwright/test';

test.describe('Jashn Celebration & Event Planner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sample-plan', { waitUntil: 'domcontentloaded' });
  });

  test('renders festive sample celebration plan blueprint', async ({ page }) => {
    // Check main branding and sample plan notice
    await expect(page.getByText('Sample Plan Mode')).toBeVisible();
    await expect(page.getByText(/Priya & Arjun/i).first()).toBeVisible();

    // Check budget figures
    await expect(page.getByText(/18,00,000/).first()).toBeVisible();
    await expect(page.getByText(/350 guests/i).first()).toBeVisible();
  });

  test('switches tabs and displays respective planning sections', async ({ page }) => {
    // Switch to Ideas tab
    await page.getByRole('tab', { name: /Ideas/i }).click();
    await expect(page.getByRole('tab', { name: /Ideas/i })).toHaveAttribute('aria-selected', 'true');

    // Switch to Scenarios tab
    await page.getByRole('tab', { name: /Scenarios/i }).click();
    await expect(page.getByRole('tab', { name: /Scenarios/i })).toHaveAttribute('aria-selected', 'true');

    // Switch to Budget tab
    await page.getByRole('tab', { name: /Budget/i }).click();
    await expect(page.getByRole('tab', { name: /Budget/i })).toHaveAttribute('aria-selected', 'true');

    // Switch to Ask the planner tab
    await page.getByRole('tab', { name: /Ask the planner/i }).click();
    await expect(page.getByRole('tab', { name: /Ask the planner/i })).toHaveAttribute('aria-selected', 'true');
  });

  test('switches celebration archetypes to 30th Milestone Birthday', async ({ page }) => {
    // Click Birthday in archetype switch pills
    await page.getByText('30th Milestone Birthday').click();

    // Header updates to Aarav's 30th celebration
    await expect(page.getByText(/Aarav's 30th Milestone Celebration/i)).toBeVisible();
  });

  test('toggles dark and light mode seamlessly', async ({ page }) => {
    const themeBtn = page.getByRole('button', { name: /Switch to dark mode|Switch to light mode/i });
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();
    await page.waitForTimeout(200);
  });
});

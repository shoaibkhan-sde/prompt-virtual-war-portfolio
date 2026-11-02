/**
 * Formatting utilities for the Landing Hero component.
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/**
 * Format currency in Indian Rupees (INR) without fractional paise.
 * Example: 1800000 -> ₹18,00,000
 */
export function formatINR(amount: number): string {
  return inrFormatter.format(amount);
}

/**
 * Calculates SVG stroke-dashoffset for circular progress rings.
 * Circumference defaults to 565 (2 * PI * 90 ≈ 565.487).
 * At 22% planned -> 441
 * At 72% planned -> 158
 * At 40% planned -> 339
 */
export function ringOffset(plannedPercent: number, circumference = 565): number {
  return Math.round(circumference * (1 - plannedPercent / 100));
}

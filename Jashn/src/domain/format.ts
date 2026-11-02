/**
 * Indian currency formatting utility.
 * Pure function with zero dependencies.
 */
export function formatINR(amount: number): string {
  const safe = Math.round(Number.isFinite(amount) ? amount : 0);
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(safe);
  } catch {
    return `₹${safe.toLocaleString('en-IN')}`;
  }
}

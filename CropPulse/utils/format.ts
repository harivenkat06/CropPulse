/**
 * Formats a number as Indian Rupees, e.g. 23400 -> "₹23,400".
 */
export function formatCurrency(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

/**
 * Formats a signed percentage change, e.g. 3.2 -> "+3.2%", -1.1 -> "-1.1%".
 */
export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Returns a friendly greeting based on the current hour.
 */
export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

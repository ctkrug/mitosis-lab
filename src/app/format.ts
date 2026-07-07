/** Thousands-separated integer formatting for the instrument HUD. */
export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return Math.trunc(Math.max(0, value)).toLocaleString("en-US");
}

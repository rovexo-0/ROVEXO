export const INVENTORY_MIN = 1;
export const INVENTORY_MAX = 99999;

export function clampInventory(value: number): number {
  if (!Number.isFinite(value)) return INVENTORY_MIN;
  return Math.min(INVENTORY_MAX, Math.max(INVENTORY_MIN, Math.round(value)));
}

/** Display/read helper — allows 0 for out-of-stock rows (never negative). */
export function clampStockLevel(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(INVENTORY_MAX, Math.max(0, Math.round(value)));
}

export function parseInventoryInput(raw: string, fallback: number): number {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return clampInventory(fallback);
  return clampInventory(Number(digits));
}

export function isLowStock(stock: number, lowStockAlert: number): boolean {
  const qty = clampStockLevel(stock);
  if (qty <= 0) return false;
  return qty <= clampInventory(lowStockAlert);
}

export function isInventoryValid(stock: number, lowStockAlert: number): boolean {
  const normalizedStock = clampInventory(stock);
  const normalizedAlert = clampInventory(lowStockAlert);
  return normalizedStock >= INVENTORY_MIN && normalizedAlert >= INVENTORY_MIN;
}

/** Homepage card badge when 1–5 units remain. */
export function formatOnlyLeftBadge(stock: number): string | null {
  const qty = clampStockLevel(stock);
  if (qty <= 0 || qty > 5) return null;
  return `Only ${qty} left`;
}

/** Seller store / seller listings line. */
export function formatSellerStockLabel(stock: number): string {
  const qty = clampStockLevel(stock);
  if (qty <= 0) return "Out of stock";
  return `${qty} available`;
}

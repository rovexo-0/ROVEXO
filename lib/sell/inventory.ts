export const INVENTORY_MIN = 1;
export const INVENTORY_MAX = 999999;

export function clampInventory(value: number): number {
  if (!Number.isFinite(value)) return INVENTORY_MIN;
  return Math.min(INVENTORY_MAX, Math.max(INVENTORY_MIN, Math.round(value)));
}

export function parseInventoryInput(raw: string, fallback: number): number {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return fallback;
  return clampInventory(Number(digits));
}

export function isLowStock(stock: number, lowStockAlert: number): boolean {
  return clampInventory(stock) <= clampInventory(lowStockAlert);
}

export function isInventoryValid(stock: number, lowStockAlert: number): boolean {
  const normalizedStock = clampInventory(stock);
  const normalizedAlert = clampInventory(lowStockAlert);
  return normalizedStock >= INVENTORY_MIN && normalizedAlert >= INVENTORY_MIN;
}

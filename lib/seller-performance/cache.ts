import type { SellerPerformanceDashboard } from "@/lib/seller-performance/types";

const CACHE_TTL_MS = 30_000;
const dashboardCache = new Map<string, { expiresAt: number; data: SellerPerformanceDashboard }>();

export function getCachedSellerPerformanceDashboard(
  userId: string,
): SellerPerformanceDashboard | null {
  const entry = dashboardCache.get(userId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    dashboardCache.delete(userId);
    return null;
  }
  return entry.data;
}

export function setCachedSellerPerformanceDashboard(
  userId: string,
  data: SellerPerformanceDashboard,
): void {
  dashboardCache.set(userId, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export function invalidateSellerPerformanceCache(userId?: string): void {
  if (userId) {
    dashboardCache.delete(userId);
    return;
  }
  dashboardCache.clear();
}

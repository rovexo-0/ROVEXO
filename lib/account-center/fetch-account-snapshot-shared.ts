/**
 * Client GET /api/account/snapshot — context-scoped in-flight Promise (P3 / Phase 1F).
 * Inflight-only (ttlMs: 0) — never soft-cache wallet/checkout financial reads.
 * Individual and Business MUST NOT share a cache/inflight key.
 */

import { shareInflightJson } from "@/lib/performance/fetch";
import type { AccountHubSnapshot } from "@/lib/account-center/snapshot";
import type { WalletData } from "@/lib/wallet/types";
import {
  accountSnapshotCacheKey,
  normalizeSellerContext,
  type SellerContext,
} from "@/lib/seller-context/seller-context-v1";

/** @deprecated Prefer accountSnapshotCacheKey(sellerContext) — Individual-only legacy key. */
export const ACCOUNT_SNAPSHOT_SHARE_KEY = accountSnapshotCacheKey("individual");

export type AccountSnapshotPayload = {
  snapshot: AccountHubSnapshot;
  wallet?: WalletData | null;
  /** Echo of requested financial context — clients must reject mismatches. */
  sellerContext: SellerContext;
};

/**
 * Canonical account snapshot fetch.
 * getAccountSnapshot equivalent: explicit sellerContext, separate inflight keys.
 */
export function fetchAccountSnapshotShared(
  sellerContext: SellerContext | string = "individual",
): Promise<AccountSnapshotPayload> {
  const context = normalizeSellerContext(sellerContext);
  const key = accountSnapshotCacheKey(context);
  return shareInflightJson<AccountSnapshotPayload>(
    key,
    `/api/account/snapshot?sellerContext=${encodeURIComponent(context)}`,
    { ttlMs: 0 },
  );
}

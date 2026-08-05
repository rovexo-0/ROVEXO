/**
 * Client GET /api/account/snapshot — one shared in-flight Promise (P3).
 * Inflight-only (ttlMs: 0) — never soft-cache wallet/checkout financial reads.
 */
import { shareInflightJson } from "@/lib/performance/fetch";
import type { AccountHubSnapshot } from "@/lib/account-center/snapshot";
import type { WalletData } from "@/lib/wallet/types";

export const ACCOUNT_SNAPSHOT_SHARE_KEY = "GET:/api/account/snapshot" as const;

export type AccountSnapshotPayload = {
  snapshot: AccountHubSnapshot;
  wallet?: WalletData | null;
};

export function fetchAccountSnapshotShared(): Promise<AccountSnapshotPayload> {
  return shareInflightJson<AccountSnapshotPayload>(
    ACCOUNT_SNAPSHOT_SHARE_KEY,
    "/api/account/snapshot",
    { ttlMs: 0 },
  );
}

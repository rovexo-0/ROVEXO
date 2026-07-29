/**
 * ROVEXO Product Integration — Sell Photo Session Host v1.0
 *
 * PRODUCT INTEGRATION · PHASE III · COD SÂNGE
 *
 * Exactly ONE active Sell photo session (ProductPhotoSystem) at a time.
 * Owns acquire / resume / cancel / reset — certified engines unmodified.
 */

import {
  createProductPhotoSystem,
  type ProductPhotoSystem,
} from "@/lib/product-integration/photo-system-integration-foundation-v1";
import {
  prepareProductPhotoCameraSession,
  resetSellProductPhotoSystem,
} from "@/lib/product-integration/sell-photo-intake-v1";

export const SELL_PHOTO_SESSION_HOST_V1 = {
  version: "1.0",
  id: "sell-photo-session-host-v1",
  phase: "PRODUCT_INTEGRATION_III_CAMERA_GALLERY",
  rule: "EXACTLY_ONE_ACTIVE_SELL_PHOTO_SESSION",
  certifiedLogicUntouchable: true,
} as const;

type HostState = {
  ownerId: string;
  system: ProductPhotoSystem;
};

let host: HostState | null = null;

export function getActiveSellPhotoSessionOwnerId(): string | null {
  return host?.ownerId ?? null;
}

export function getActiveSellPhotoSystem(): ProductPhotoSystem | null {
  return host?.system ?? null;
}

/**
 * Acquire the single active Sell photo system for this owner.
 * If another owner held the session, it is cancelled first.
 */
export function acquireSellPhotoSession(ownerId: string): ProductPhotoSystem {
  const id = ownerId.trim();
  if (!id) {
    throw new Error("Sell photo session owner id is required.");
  }

  if (host && host.ownerId === id) {
    return host.system;
  }

  if (host) {
    cancelSellPhotoSession();
  }

  host = {
    ownerId: id,
    system: createProductPhotoSystem(),
  };
  return host.system;
}

/** Resume / prepare certified Multi Camera session for capture/gallery intake. */
export function resumeSellPhotoSession(
  ownerId: string,
): { ok: true; system: ProductPhotoSystem } | { ok: false; message: string } {
  const system = acquireSellPhotoSession(ownerId);
  const prepared = prepareProductPhotoCameraSession(system);
  if (!prepared.ok) {
    return { ok: false, message: prepared.message };
  }
  return { ok: true, system };
}

/** Cancel active session → IDLE · clear collection · reset pipeline. */
export function cancelSellPhotoSession(): void {
  if (!host) return;
  resetSellProductPhotoSystem(host.system);
  host = null;
}

/** Reset session for the same owner (fresh listing) without changing owner id. */
export function resetSellPhotoSession(ownerId: string): ProductPhotoSystem {
  const system = acquireSellPhotoSession(ownerId);
  resetSellProductPhotoSystem(system);
  return system;
}

export function assertSingleActiveSellPhotoSession(): {
  ok: true;
  ownerId: string | null;
} {
  return { ok: true, ownerId: host?.ownerId ?? null };
}

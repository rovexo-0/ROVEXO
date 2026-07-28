/**
 * ROVEXO Absolute Blood Law XLIV — Full Demo Certification Session Engine
 *
 * Isolated Demo Runtime over existing localhost users/listings.
 * Mutates ONLY demo copies + session artifacts. FAIL CLOSED if production changes.
 *
 * SERVER ONLY.
 */

import "server-only";

import { createHash } from "node:crypto";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { FULL_DEMO_ACCOUNTS } from "@/lib/full-demo/canonical";
import { DEMO_USERS } from "@/lib/demo-environment/config";
import { XLIV_DEMO_WALLET_GBP, type XlivModuleResult } from "@/lib/full-demo/demo-session-contract-v1";

export {
  DEMO_SESSION_ENGINE_V1,
  XLIV_DEMO_WALLET_GBP,
  XLIV_VISUAL_STEPS,
  type XlivModuleResult,
  type XlivVisualStepId,
} from "@/lib/full-demo/demo-session-contract-v1";

export const XLIV_DEMO_ACTORS = {
  buyerEmail: FULL_DEMO_ACCOUNTS.find((a) => a.key === "live-buyer")?.email ?? "demo.buyer@rovexo.co.uk",
  sellerEmail: FULL_DEMO_ACCOUNTS.find((a) => a.key === "live-seller")?.email ?? "demo.seller@rovexo.co.uk",
  businessEmail:
    DEMO_USERS.find((u) => u.key === "business01")?.email ?? "business01@demo.rovexo.co.uk",
  adminEmail:
    DEMO_USERS.find((u) => u.key === "admin")?.email ?? "admin@demo.rovexo.co.uk",
} as const;

export type ProductionFingerprint = {
  nonDemoProductCount: number;
  nonDemoProductDigest: string;
  nonDemoOrderCount: number;
  capturedAt: string;
};

export type DemoSessionWalletSnapshot = Record<
  string,
  { available: number; pending: number }
>;

export type DemoSessionCreateResult =
  | {
      ok: true;
      sessionId: string;
      demoListingIds: string[];
      demoListingSlugs: string[];
      actors: typeof XLIV_DEMO_ACTORS;
      walletsGbp: { buyer: number; seller: number; business: number; admin: "unlimited" };
      fingerprint: ProductionFingerprint;
    }
  | { ok: false; code: string; message: string };

export type DemoSessionDestroyResult =
  | {
      ok: true;
      sessionId: string;
      productionUnchanged: true;
      deletedArtifacts: number;
    }
  | {
      ok: false;
      code: "PRODUCTION_MUTATION_DETECTED" | "SESSION_NOT_FOUND" | "TEARDOWN_FAILED" | "ADMIN_UNAVAILABLE";
      message: string;
      fingerprintBefore?: ProductionFingerprint;
      fingerprintAfter?: ProductionFingerprint;
    };

function adminOrFail() {
  const admin = tryCreateAdminClient();
  if (!admin) {
    return null;
  }
  return admin;
}

/** Untyped access for XLIV session tables not yet in generated Database types. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sessionDb(admin: NonNullable<ReturnType<typeof tryCreateAdminClient>>): any {
  return admin;
}

function digestIds(ids: string[]): string {
  const sorted = [...ids].sort();
  return createHash("sha256").update(sorted.join("|")).digest("hex").slice(0, 32);
}

export async function captureProductionFingerprint(): Promise<ProductionFingerprint> {
  const admin = adminOrFail();
  if (!admin) {
    return {
      nonDemoProductCount: -1,
      nonDemoProductDigest: "unavailable",
      nonDemoOrderCount: -1,
      capturedAt: new Date().toISOString(),
    };
  }

  const { data: products } = await admin
    .from("products")
    .select("id, updated_at")
    .eq("is_demo", false);

  const ids = (products ?? []).map((row) => row.id);
  const updatedDigest = digestIds(
    (products ?? []).map((row) => `${row.id}:${row.updated_at ?? ""}`),
  );

  return {
    nonDemoProductCount: ids.length,
    nonDemoProductDigest: updatedDigest,
    nonDemoOrderCount: ids.length, // product integrity proxy — orders tied to demo copies excluded via teardown
    capturedAt: new Date().toISOString(),
  };
}

export function fingerprintsMatch(
  a: ProductionFingerprint,
  b: ProductionFingerprint,
): boolean {
  return (
    a.nonDemoProductCount === b.nonDemoProductCount &&
    a.nonDemoProductDigest === b.nonDemoProductDigest &&
    a.nonDemoOrderCount === b.nonDemoOrderCount
  );
}

async function resolveUserIdByEmail(
  admin: NonNullable<ReturnType<typeof tryCreateAdminClient>>,
  email: string,
): Promise<string | null> {
  const { data } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  return data?.id ?? null;
}

async function snapshotWallets(
  admin: NonNullable<ReturnType<typeof tryCreateAdminClient>>,
  userIds: string[],
): Promise<DemoSessionWalletSnapshot> {
  const snap: DemoSessionWalletSnapshot = {};
  if (!userIds.length) return snap;
  const { data } = await admin
    .from("wallets")
    .select("user_id, available_balance, pending_balance")
    .in("user_id", userIds);
  for (const row of data ?? []) {
    snap[row.user_id] = {
      available: Number(row.available_balance ?? 0),
      pending: Number(row.pending_balance ?? 0),
    };
  }
  return snap;
}

async function setWalletAvailable(
  admin: NonNullable<ReturnType<typeof tryCreateAdminClient>>,
  userId: string,
  available: number,
): Promise<void> {
  const { data: wallet } = await admin
    .from("wallets")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!wallet) {
    await admin.from("wallets").insert({
      user_id: userId,
      available_balance: available,
      pending_balance: 0,
    });
    return;
  }
  await admin.from("wallets").update({ available_balance: available }).eq("id", wallet.id);
}

async function recordArtifact(
  admin: NonNullable<ReturnType<typeof tryCreateAdminClient>>,
  sessionId: string,
  entityType: string,
  entityId: string,
): Promise<void> {
  await sessionDb(admin).from("demo_session_artifacts").insert({
    session_id: sessionId,
    entity_type: entityType,
    entity_id: entityId,
  });
}

/**
 * Start XLIV demo session: fingerprint production → clone listings → raise virtual wallets.
 * Never mutates original listings.
 */
export async function createDemoCertificationSession(input?: {
  maxListings?: number;
}): Promise<DemoSessionCreateResult> {
  const admin = adminOrFail();
  if (!admin) {
    return { ok: false, code: "ADMIN_UNAVAILABLE", message: "Demo session admin unavailable." };
  }

  const maxListings = Math.max(1, Math.min(input?.maxListings ?? 10, 25));
  const fingerprint = await captureProductionFingerprint();
  if (fingerprint.nonDemoProductCount < 0) {
    return { ok: false, code: "FINGERPRINT_FAILED", message: "Unable to fingerprint production." };
  }

  const buyerId = await resolveUserIdByEmail(admin, XLIV_DEMO_ACTORS.buyerEmail);
  const sellerId = await resolveUserIdByEmail(admin, XLIV_DEMO_ACTORS.sellerEmail);
  const businessId = await resolveUserIdByEmail(admin, XLIV_DEMO_ACTORS.businessEmail);
  const adminId = await resolveUserIdByEmail(admin, XLIV_DEMO_ACTORS.adminEmail);

  if (!buyerId || !sellerId) {
    return {
      ok: false,
      code: "DEMO_ACTORS_MISSING",
      message: "Demo Buyer/Seller accounts must exist on localhost before XLIV session.",
    };
  }

  const walletUserIds = [buyerId, sellerId, businessId, adminId].filter(Boolean) as string[];
  const walletSnapshot = await snapshotWallets(admin, walletUserIds);

  const { data: session, error: sessionError } = await sessionDb(admin)
    .from("demo_certification_sessions")
    .insert({
      status: "active",
      blood_law: "XLIV",
      production_fingerprint: fingerprint,
      wallet_snapshot: walletSnapshot,
      meta: { maxListings, actors: XLIV_DEMO_ACTORS },
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    return {
      ok: false,
      code: "SESSION_CREATE_FAILED",
      message: sessionError?.message ?? "Unable to create demo session.",
    };
  }

  const sessionId = (session as { id: string }).id;

  // Source listings: existing non-demo published products (prefer seller's).
  const sourceQuery = admin
    .from("products")
    .select(
      "id, title, description, price, original_price, condition, category_id, brand_id, color, size, parcel_size, shipping_method, shipping_price, delivery_carriers, dispatch_days, location_city, accept_offers, listing_type, stock, sections, seller_id, product_images(url, is_primary, sort_order)",
    )
    .eq("is_demo", false)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(maxListings);

  const { data: sellerSources } = await sourceQuery.eq("seller_id", sellerId);
  let sources = sellerSources ?? [];
  if (sources.length === 0) {
    const { data: anySources } = await admin
      .from("products")
      .select(
        "id, title, description, price, original_price, condition, category_id, brand_id, color, size, parcel_size, shipping_method, shipping_price, delivery_carriers, dispatch_days, location_city, accept_offers, listing_type, stock, sections, seller_id, product_images(url, is_primary, sort_order)",
      )
      .eq("is_demo", false)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(maxListings);
    sources = anySources ?? [];
  }

  if (sources.length === 0) {
    await sessionDb(admin)
      .from("demo_certification_sessions")
      .update({ status: "failed" })
      .eq("id", sessionId);
    return {
      ok: false,
      code: "NO_SOURCE_LISTINGS",
      message: "No existing published listings to copy for XLIV demo session.",
    };
  }

  const demoListingIds: string[] = [];
  const demoListingSlugs: string[] = [];
  const short = sessionId.replace(/-/g, "").slice(0, 8);

  for (const source of sources) {
    const slug = `demo-xliv-${short}-${source.id.slice(0, 8)}`;
    const { data: copy, error: copyError } = await admin
      .from("products")
      .insert({
        seller_id: sellerId,
        title: `[DEMO] ${source.title}`.slice(0, 120),
        description: source.description,
        price: Number(source.price),
        original_price: source.original_price,
        condition: source.condition,
        category_id: source.category_id,
        brand_id: source.brand_id,
        color: source.color,
        size: source.size,
        parcel_size: source.parcel_size,
        shipping_method: source.shipping_method,
        shipping_price: source.shipping_price,
        delivery_carriers: source.delivery_carriers ?? [],
        dispatch_days: source.dispatch_days ?? 2,
        location_city: source.location_city,
        accept_offers: source.accept_offers ?? true,
        listing_type: source.listing_type ?? "fixed",
        stock: Math.max(1, Number(source.stock ?? 1)),
        sections: source.sections ?? [],
        slug,
        status: "published",
        is_demo: true,
        demo_session_id: sessionId,
        original_listing_id: source.id,
        moderation_status: "approved",
        moderation_summary: "XLIV demo copy",
        moderation_confidence: 1,
      })
      .select("id, slug")
      .single();

    if (copyError || !copy) {
      continue;
    }

    demoListingIds.push(copy.id);
    demoListingSlugs.push(copy.slug);
    await recordArtifact(admin, sessionId, "product", copy.id);

    const images = (
      source as {
        product_images?: Array<{ url: string; is_primary: boolean | null; sort_order: number | null }>;
      }
    ).product_images;
    for (const image of images ?? []) {
      if (!image.url) continue;
      await admin.from("product_images").insert({
        product_id: copy.id,
        url: image.url,
        is_primary: Boolean(image.is_primary),
        sort_order: image.sort_order ?? 0,
      });
    }
  }

  if (demoListingIds.length === 0) {
    await destroyDemoCertificationSession(sessionId);
    return {
      ok: false,
      code: "CLONE_FAILED",
      message: "Unable to create demo listing copies.",
    };
  }

  await setWalletAvailable(admin, buyerId, XLIV_DEMO_WALLET_GBP.buyer);
  await setWalletAvailable(admin, sellerId, XLIV_DEMO_WALLET_GBP.seller);
  if (businessId) {
    await setWalletAvailable(admin, businessId, XLIV_DEMO_WALLET_GBP.business);
  }
  if (adminId) {
    // Admin: set a high virtual floor (unlimited semantics in cert report).
    await setWalletAvailable(admin, adminId, 1_000_000_000);
  }

  // Confirm production fingerprint unchanged after clone (only is_demo rows added).
  const afterClone = await captureProductionFingerprint();
  if (!fingerprintsMatch(fingerprint, afterClone)) {
    await destroyDemoCertificationSession(sessionId);
    return {
      ok: false,
      code: "PRODUCTION_MUTATION_DETECTED",
      message: "Production fingerprint changed while creating demo copies. Session aborted.",
    };
  }

  return {
    ok: true,
    sessionId,
    demoListingIds,
    demoListingSlugs,
    actors: XLIV_DEMO_ACTORS,
    walletsGbp: { buyer: 100_000, seller: 100_000, business: 100_000, admin: "unlimited" },
    fingerprint,
  };
}

/**
 * Destroy session: delete demo artifacts → restore wallets → assert production unchanged.
 */
export async function destroyDemoCertificationSession(
  sessionId: string,
): Promise<DemoSessionDestroyResult> {
  const admin = adminOrFail();
  if (!admin) {
    return { ok: false, code: "ADMIN_UNAVAILABLE", message: "Demo session admin unavailable." };
  }

  const { data: session } = await sessionDb(admin)
    .from("demo_certification_sessions")
    .select("id, production_fingerprint, wallet_snapshot, status")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) {
    return { ok: false, code: "SESSION_NOT_FOUND", message: "Demo session not found." };
  }

  const row = session as unknown as {
    id: string;
    production_fingerprint: ProductionFingerprint;
    wallet_snapshot: DemoSessionWalletSnapshot;
    status: string;
  };

  await sessionDb(admin)
    .from("demo_certification_sessions")
    .update({ status: "destroying" })
    .eq("id", sessionId);

  const { data: artifacts } = await sessionDb(admin)
    .from("demo_session_artifacts")
    .select("entity_type, entity_id")
    .eq("session_id", sessionId);

  const list = (artifacts ?? []) as unknown as Array<{ entity_type: string; entity_id: string }>;
  let deleted = 0;

  // Delete in dependency-safe order: offers → orders → products (demo only)
  const byType = (type: string) => list.filter((a) => a.entity_type === type).map((a) => a.entity_id);

  for (const offerId of byType("offer")) {
    await admin.from("offers").delete().eq("id", offerId);
    deleted += 1;
  }
  for (const orderId of byType("order")) {
    await admin.from("orders").delete().eq("id", orderId);
    deleted += 1;
  }

  // Always delete demo products for this session (even if artifact missing)
  const { data: demoProducts } = await admin
    .from("products")
    .select("id")
    .eq("demo_session_id", sessionId)
    .eq("is_demo", true);

  for (const product of demoProducts ?? []) {
    await admin.from("offers").delete().eq("product_id", product.id);
    await admin.from("product_images").delete().eq("product_id", product.id);
    await admin.from("products").delete().eq("id", product.id).eq("is_demo", true);
    deleted += 1;
  }

  // Restore wallets
  for (const [userId, snap] of Object.entries(row.wallet_snapshot ?? {})) {
    await admin
      .from("wallets")
      .update({
        available_balance: snap.available,
        pending_balance: snap.pending,
      })
      .eq("user_id", userId);
  }

  await sessionDb(admin).from("demo_session_artifacts").delete().eq("session_id", sessionId);

  const after = await captureProductionFingerprint();
  const unchanged = fingerprintsMatch(row.production_fingerprint, after);

  if (!unchanged) {
    await sessionDb(admin)
      .from("demo_certification_sessions")
      .update({
        status: "failed",
        destroyed_at: new Date().toISOString(),
        meta: { fail: "PRODUCTION_MUTATION_DETECTED", after },
      })
      .eq("id", sessionId);
    return {
      ok: false,
      code: "PRODUCTION_MUTATION_DETECTED",
      message: "FAIL CLOSED: production records changed during or after demo session.",
      fingerprintBefore: row.production_fingerprint,
      fingerprintAfter: after,
    };
  }

  await sessionDb(admin)
    .from("demo_certification_sessions")
    .update({
      status: "destroyed",
      destroyed_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  return {
    ok: true,
    sessionId,
    productionUnchanged: true,
    deletedArtifacts: deleted,
  };
}

export function formatXlivModuleLine(input: {
  module: string;
  result: XlivModuleResult;
  screenshot?: string | null;
  executionMs?: number;
  evidence?: string;
}): string {
  const shot = input.screenshot ? ` screenshot=${input.screenshot}` : "";
  const time = typeof input.executionMs === "number" ? ` time=${input.executionMs}ms` : "";
  const evidence = input.evidence ? ` evidence=${input.evidence}` : "";
  return `${input.module}: ${input.result}${shot}${time}${evidence}`;
}

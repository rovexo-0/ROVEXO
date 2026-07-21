/**
 * ROVEXO v1.0 — Server record unique product view (DATABASE SSOT).
 * Called only from POST /api/views after product-page 1.5s dwell.
 *
 * CANONICAL:
 * OWNER = 0 · ADMIN = 0 · SUPER_ADMIN = 0 · STAFF = 0 · BOT = 0 · UNPUBLISHED = 0
 * Unique viewers only · same viewer within 24h = +0 · refresh/tab/relogin = +0
 */

import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import { isBotUserAgent, resolveViewerKey } from "@/lib/views/viewer-key";

export type RecordProductViewResult = {
  counted: boolean;
  views: number | null;
  reason:
    | "counted"
    | "owner"
    | "staff"
    | "dedup_24h"
    | "anti_spam"
    | "bot"
    | "unpublished"
    | "unavailable"
    | "error";
};

async function readViews(slug: string): Promise<number | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("views")
      .eq("slug", slug)
      .maybeSingle();
    if (data?.views == null) return null;
    return Number(data.views);
  } catch {
    return null;
  }
}

async function isPlatformStaff(userId: string): Promise<boolean> {
  try {
    const { loadStaffRoleIdsByProfileId } = await import(
      "@/lib/staff-enterprise/permissions"
    );
    const linked = await loadStaffRoleIdsByProfileId(userId);
    return Boolean(linked.staffId && linked.roleIds.length > 0);
  } catch {
    return false;
  }
}

/**
 * Record a unique product view. Fail closed → counted false.
 * OWNER = 0 is enforced in application layer (canonical) before RPC.
 */
export async function recordProductView(
  slug: string,
  options?: { userAgent?: string | null },
): Promise<RecordProductViewResult> {
  if (!slug) {
    return { counted: false, views: null, reason: "unavailable" };
  }

  if (isBotUserAgent(options?.userAgent)) {
    return { counted: false, views: await readViews(slug), reason: "bot" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: product } = await supabase
      .from("products")
      .select("seller_id, status, views")
      .eq("slug", slug)
      .maybeSingle();

    if (!product) {
      return { counted: false, views: null, reason: "unavailable" };
    }

    const currentViews =
      product.views == null ? null : Number(product.views);

    if (product.status !== "published") {
      return { counted: false, views: currentViews, reason: "unpublished" };
    }

    if (user?.id) {
      const role = await getUserRole(user.id);
      if (isAdmin(role) || role === "super_admin") {
        return { counted: false, views: currentViews, reason: "staff" };
      }
      if (await isPlatformStaff(user.id)) {
        return { counted: false, views: currentViews, reason: "staff" };
      }

      // OWNER = 0 — listing seller never increments own views
      if (product.seller_id && product.seller_id === user.id) {
        return { counted: false, views: currentViews, reason: "owner" };
      }
    }

    const { viewerKey, isBot } = await resolveViewerKey(user?.id ?? null);
    if (isBot) {
      return { counted: false, views: currentViews, reason: "bot" };
    }

    const { data, error } = await supabase.rpc("record_unique_product_view", {
      product_slug: slug,
      p_viewer_key: viewerKey,
      p_viewer_user_id: user?.id ?? null,
    });

    if (error) {
      return { counted: false, views: await readViews(slug), reason: "error" };
    }

    const views = await readViews(slug);

    if (data === true) {
      return { counted: true, views, reason: "counted" };
    }

    return { counted: false, views, reason: "dedup_24h" };
  } catch {
    return { counted: false, views: null, reason: "error" };
  }
}

/** @deprecated Server after() path removed — use POST /api/views only. */
export async function incrementProductViews(slug: string): Promise<void> {
  await recordProductView(slug);
}

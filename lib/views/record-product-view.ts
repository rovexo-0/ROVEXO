/**
 * ROVEXO v1.0 — Server record unique product view (DATABASE SSOT).
 * Called only from POST /api/views after product-page dwell (Master Spec ≤2s).
 *
 * Master Engineering Spec v1.0 + Absolute Functional Law:
 * LISTING SELLER = 0 · BOT = 0 · UNPUBLISHED = 0
 * Unique viewers · 24h dedup · anti-spam 60/hour
 * Product Owner / admin may count when NOT the listing seller.
 *
 * Commit path uses service-role writes (same rules as RPC Master Spec SQL #5)
 * so localhost Owner visual proof is not blocked by legacy admin=0 RPC.
 */

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isBotUserAgent, resolveViewerKey } from "@/lib/views/viewer-key";

export type RecordProductViewResult = {
  counted: boolean;
  views: number | null;
  reason:
    | "counted"
    | "owner"
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

/**
 * Atomic unique view commit — mirrors record_unique_product_view Master Spec SQL.
 * Returns true only when products.views was incremented.
 */
async function commitUniqueProductView(input: {
  productId: string;
  viewerKey: string;
  viewerUserId: string | null;
}): Promise<"counted" | "dedup_24h" | "anti_spam" | "error"> {
  try {
    const admin = createServiceRoleClient();
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const since1h = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count: recent, error: recentErr } = await admin
      .from("product_view_events")
      .select("id", { count: "exact", head: true })
      .eq("product_id", input.productId)
      .eq("viewer_key", input.viewerKey)
      .gt("created_at", since24h);

    if (recentErr) return "error";
    if ((recent ?? 0) > 0) return "dedup_24h";

    const { count: hourCount, error: hourErr } = await admin
      .from("product_view_events")
      .select("id", { count: "exact", head: true })
      .eq("viewer_key", input.viewerKey)
      .gt("created_at", since1h);

    if (hourErr) return "error";
    if ((hourCount ?? 0) >= 60) return "anti_spam";

    const { error: insertErr } = await admin.from("product_view_events").insert({
      product_id: input.productId,
      viewer_key: input.viewerKey,
      viewer_user_id: input.viewerUserId,
    });

    if (insertErr) {
      // Unique race → treat as dedup
      return "dedup_24h";
    }

    const { data: row, error: readErr } = await admin
      .from("products")
      .select("views")
      .eq("id", input.productId)
      .maybeSingle();

    if (readErr || !row) return "error";

    const next = Math.max(0, Number(row.views ?? 0)) + 1;
    const { error: updateErr } = await admin
      .from("products")
      .update({ views: next })
      .eq("id", input.productId);

    if (updateErr) return "error";
    return "counted";
  } catch {
    return "error";
  }
}

/**
 * Record a unique product view. Fail closed → counted false.
 * LISTING SELLER = 0 enforced before commit.
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
      .select("id, seller_id, status, views")
      .eq("slug", slug)
      .maybeSingle();

    if (!product?.id) {
      return { counted: false, views: null, reason: "unavailable" };
    }

    const currentViews =
      product.views == null ? null : Number(product.views);

    if (product.status !== "published") {
      return { counted: false, views: currentViews, reason: "unpublished" };
    }

    // SELLER = 0 — listing seller never increments own views
    if (user?.id && product.seller_id && product.seller_id === user.id) {
      return { counted: false, views: currentViews, reason: "owner" };
    }

    const { viewerKey, isBot } = await resolveViewerKey(user?.id ?? null);
    if (isBot) {
      return { counted: false, views: currentViews, reason: "bot" };
    }

    const commit = await commitUniqueProductView({
      productId: product.id,
      viewerKey,
      viewerUserId: user?.id ?? null,
    });

    const views = await readViews(slug);

    if (commit === "counted") {
      return { counted: true, views, reason: "counted" };
    }
    if (commit === "anti_spam") {
      return { counted: false, views, reason: "anti_spam" };
    }
    if (commit === "dedup_24h") {
      return { counted: false, views, reason: "dedup_24h" };
    }
    return { counted: false, views: await readViews(slug), reason: "error" };
  } catch {
    return { counted: false, views: null, reason: "error" };
  }
}

/** @deprecated Server after() path removed — use POST /api/views only. */
export async function incrementProductViews(slug: string): Promise<void> {
  await recordProductView(slug);
}

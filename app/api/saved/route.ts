import { NextResponse } from "next/server";
import { enforceRateLimitForUser } from "@/lib/api/rate-limit";
import { requireSavedApiAuth } from "@/lib/saved/saved-api-auth-v1";
import { listSavedItems, removeSavedItems, saveItem } from "@/lib/saved/store";

/**
 * LIVE production Saved API — extracted from origin/main|develop.
 * POST → { saved: true } · DELETE → { items } · GET ?slug= → { saved }
 * Auth: cookie session (web) or Authorization Bearer (native).
 */

export async function GET(request: Request) {
  const auth = await requireSavedApiAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (slug) {
    const { isProductSaved } = await import("@/lib/saved/check");
    const saved = await isProductSaved(auth.user.id, slug);
    return NextResponse.json({ saved });
  }

  const items = await listSavedItems(auth.user.id);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const auth = await requireSavedApiAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const limited = await enforceRateLimitForUser(auth.user.id, "saved-mutate", 60, 60_000);
  if (limited) return limited;

  try {
    const body = (await request.json()) as { productSlug?: string };
    if (!body.productSlug) {
      return NextResponse.json({ error: "Product slug is required." }, { status: 400 });
    }

    const saved = await saveItem(auth.user.id, body.productSlug);
    if (!saved) {
      return NextResponse.json({ error: "Unable to save item." }, { status: 500 });
    }
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: "Unable to save item." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireSavedApiAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const limited = await enforceRateLimitForUser(auth.user.id, "saved-mutate", 60, 60_000);
  if (limited) return limited;

  try {
    const body = (await request.json()) as { productSlugs?: string[] };

    if (!body.productSlugs?.length) {
      return NextResponse.json({ error: "No items selected." }, { status: 400 });
    }

    const items = await removeSavedItems(auth.user.id, body.productSlugs);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Unable to remove saved items." }, { status: 500 });
  }
}

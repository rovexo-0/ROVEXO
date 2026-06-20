import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { listSavedItems, removeSavedItems, saveItem } from "@/lib/saved/store";

export async function GET(request: Request) {
  const auth = await requireApiAuth();
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
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = (await request.json()) as { productSlug?: string };
    if (!body.productSlug) {
      return NextResponse.json({ error: "Product slug is required." }, { status: 400 });
    }

    await saveItem(auth.user.id, body.productSlug);
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: "Unable to save item." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

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

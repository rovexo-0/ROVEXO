import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth/session";
import { listRecentlyViewed, recordRecentlyViewed } from "@/lib/launch/recently-viewed";

const schema = z.object({
  productSlug: z.string().min(1),
});

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const items = await listRecentlyViewed(auth.user.id);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = schema.parse(await request.json());
    await recordRecentlyViewed(auth.user.id, body.productSlug);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid recently viewed request." }, { status: 400 });
  }
}

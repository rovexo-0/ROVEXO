import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  getPromotionCatalogConfig,
  getResolvedPromotionCatalog,
} from "@/lib/promotions/catalog";

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (url.searchParams.get("raw") === "1") {
    const auth = await requireApiSuperAdmin();
    if (auth instanceof NextResponse) return auth;

    const config = await getPromotionCatalogConfig();
    return NextResponse.json({ config });
  }

  const catalog = await getResolvedPromotionCatalog();
  return NextResponse.json({ catalog });
}

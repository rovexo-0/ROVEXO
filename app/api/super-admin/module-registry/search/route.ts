import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getModuleRegistryV2Snapshot } from "@/lib/enterprise-module-registry-v2/reader";
import { searchRegistryModules } from "@/lib/enterprise-module-registry-v2/search";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const snapshot = await getModuleRegistryV2Snapshot("search");
  const results = searchRegistryModules(snapshot.modules, {
    q: url.searchParams.get("q") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    owner: url.searchParams.get("owner") ?? undefined,
    version: url.searchParams.get("version") ?? undefined,
    tag: url.searchParams.get("tag") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });

  return NextResponse.json({ results, count: results.length });
}

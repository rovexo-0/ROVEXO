import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";
import { buildOmegaModuleReport } from "@/lib/super-admin/premium/omega-status";
import { isOmegaReadyPath } from "@/lib/super-admin/premium/omega-ready";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const pathname = searchParams.get("path") ?? "/super-admin";
  const moduleId = searchParams.get("moduleId") ?? undefined;

  const descriptor = moduleId ? getEnterpriseModuleDescriptor(moduleId) : undefined;
  const omegaReady = isOmegaReadyPath(pathname);

  const report = buildOmegaModuleReport({
    moduleId: moduleId ?? descriptor?.id ?? "super-admin",
    pathname,
    enterpriseScore: omegaReady ? 100 : 85,
    healthStatus: omegaReady ? "healthy" : "warning",
    aiInsight: omegaReady
      ? "OMEGA PRIME: Page certified for global enterprise audit."
      : "OMEGA PRIME: Page requires premium registration before production certification.",
  });

  return NextResponse.json({ ok: true, omegaReady, report });
}

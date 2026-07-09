import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth, requireApiRole } from "@/lib/auth/session";
import { isStoreMigrationEnabled } from "@/lib/seller/migration/config";
import { getUniversalConnector } from "@/lib/seller/migration/connectors/registry";
import { MIGRATION_PLATFORM_IDS } from "@/lib/seller/migration/providers/registry";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";

const platformSchema = z
  .string()
  .refine((value): value is MigrationPlatformId =>
    (MIGRATION_PLATFORM_IDS as readonly string[]).includes(value),
  );

export async function GET(request: Request) {
  if (!isStoreMigrationEnabled()) {
    return NextResponse.json({ error: "Bring Your Item is not yet available." }, { status: 403 });
  }

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  const platformParam = new URL(request.url).searchParams.get("platform");
  const platform = platformSchema.safeParse(platformParam);
  if (!platform.success) {
    return NextResponse.json({ error: "Unknown marketplace platform." }, { status: 400 });
  }

  try {
    const connector = getUniversalConnector(platform.data);
    const total = await connector.estimateTotal({
      sellerId: auth.user.id,
      jobId: "estimate",
      platform: platform.data,
      importMethod: "api_import",
    });
    return NextResponse.json({ total, platform: platform.data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to estimate listings." },
      { status: 400 },
    );
  }
}

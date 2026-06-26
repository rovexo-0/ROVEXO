import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth, requireApiRole } from "@/lib/auth/session";
import { isStoreMigrationEnabled } from "@/lib/seller/migration/config";
import { getConnectorStatus } from "@/lib/seller/migration/connectors/manager";
import { getUniversalConnector } from "@/lib/seller/migration/connectors/registry";
import { MIGRATION_PLATFORM_IDS } from "@/lib/seller/migration/providers/registry";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";

type RouteContext = {
  params: Promise<{ platform: string }>;
};

const platformSchema = z
  .string()
  .refine((value): value is MigrationPlatformId =>
    (MIGRATION_PLATFORM_IDS as readonly string[]).includes(value),
  );

const connectSchema = z.object({
  storeUrl: z.string().max(500).optional(),
  apiKey: z.string().max(500).optional(),
  apiSecret: z.string().max(500).optional(),
  accessToken: z.string().max(2000).optional(),
  refreshToken: z.string().max(2000).optional(),
  fileName: z.string().max(200).optional(),
  fileContent: z.string().max(5_000_000).optional(),
  settings: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  if (!isStoreMigrationEnabled()) {
    return NextResponse.json({ error: "Migration feature is disabled." }, { status: 404 });
  }

  const { platform: platformParam } = await context.params;
  const platform = platformSchema.safeParse(platformParam);
  if (!platform.success) {
    return NextResponse.json({ error: "Unknown connector platform." }, { status: 400 });
  }

  const status = await getConnectorStatus(auth.user.id, platform.data);
  return NextResponse.json({ connector: status });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  if (!isStoreMigrationEnabled()) {
    return NextResponse.json({ error: "Migration feature is disabled." }, { status: 404 });
  }

  const { platform: platformParam } = await context.params;
  const platform = platformSchema.safeParse(platformParam);
  if (!platform.success) {
    return NextResponse.json({ error: "Unknown connector platform." }, { status: 400 });
  }

  try {
    const body = connectSchema.parse(await request.json());
    const connector = getUniversalConnector(platform.data);
    await connector.connect({
      sellerId: auth.user.id,
      platform: platform.data,
      ...body,
    });
    const status = await connector.getStatus(auth.user.id);
    return NextResponse.json({ connector: status });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid connector configuration." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to connect provider." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { platform: platformParam } = await context.params;
  const platform = platformSchema.safeParse(platformParam);
  if (!platform.success) {
    return NextResponse.json({ error: "Unknown connector platform." }, { status: 400 });
  }

  const connector = getUniversalConnector(platform.data);
  await connector.disconnect(auth.user.id);
  const status = await connector.getStatus(auth.user.id);
  return NextResponse.json({ connector: status });
}

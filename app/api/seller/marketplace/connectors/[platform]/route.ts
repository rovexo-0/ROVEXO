import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth, requireApiRole } from "@/lib/auth/session";
import { MIGRATION_PLATFORM_IDS } from "@/lib/seller/migration/providers/registry";
import { isMarketplaceConnectorsEnabled } from "@/lib/seller/marketplace/config";
import { getMarketplaceAnalyticsSnapshot } from "@/lib/seller/marketplace/adapters/analytics";
import {
  resetMarketplaceProviderSettings,
  setMarketplaceProviderEnabled,
  updateMarketplaceProviderSettings,
} from "@/lib/seller/marketplace/configuration";
import {
  connectMarketplaceCredentials,
  deleteMarketplaceCredentials,
} from "@/lib/seller/marketplace/credentials";
import { getMarketplaceProviderView } from "@/lib/seller/marketplace/manager";
import { getMarketplaceProvider } from "@/lib/seller/marketplace/factory";
import { checkMarketplaceHealth } from "@/lib/seller/marketplace/health";
import { retryMarketplaceConnection } from "@/lib/seller/marketplace/retry";
import { refreshOAuthTokens } from "@/lib/seller/marketplace/oauth/token-manager";
import { isOAuthPlatform } from "@/lib/seller/marketplace/oauth/types";
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

const patchSchema = z.object({
  action: z.enum([
    "enable",
    "disable",
    "reconnect",
    "disconnect",
    "reset",
    "delete_credentials",
    "health_check",
    "retry",
    "refresh_token",
  ]),
  settings: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  if (!isMarketplaceConnectorsEnabled()) {
    return NextResponse.json({ error: "Marketplace connectors are disabled." }, { status: 404 });
  }

  const { platform: platformParam } = await context.params;
  const platform = platformSchema.safeParse(platformParam);
  if (!platform.success) {
    return NextResponse.json({ error: "Unknown marketplace provider." }, { status: 400 });
  }

  const [provider, analytics] = await Promise.all([
    getMarketplaceProviderView(auth.user.id, platform.data),
    getMarketplaceAnalyticsSnapshot(auth.user.id, platform.data),
  ]);

  return NextResponse.json({ provider, analytics });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  if (!isMarketplaceConnectorsEnabled()) {
    return NextResponse.json({ error: "Marketplace connectors are disabled." }, { status: 404 });
  }

  const { platform: platformParam } = await context.params;
  const platform = platformSchema.safeParse(platformParam);
  if (!platform.success) {
    return NextResponse.json({ error: "Unknown marketplace provider." }, { status: 400 });
  }

  try {
    const body = connectSchema.parse(await request.json());
    const marketplaceProvider = getMarketplaceProvider(platform.data);
    const validation = await marketplaceProvider.validate({
      sellerId: auth.user.id,
      platform: platform.data,
      ...body,
    });
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors[0]?.message ?? "Invalid configuration." },
        { status: 400 },
      );
    }

    await connectMarketplaceCredentials({
      sellerId: auth.user.id,
      platform: platform.data,
      ...body,
    });

    const provider = await getMarketplaceProviderView(auth.user.id, platform.data);
    return NextResponse.json({ provider });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to connect provider." },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { platform: platformParam } = await context.params;
  const platform = platformSchema.safeParse(platformParam);
  if (!platform.success) {
    return NextResponse.json({ error: "Unknown marketplace provider." }, { status: 400 });
  }

  try {
    const body = patchSchema.parse(await request.json());

    switch (body.action) {
      case "enable":
        await setMarketplaceProviderEnabled(auth.user.id, platform.data, true);
        break;
      case "disable":
        await setMarketplaceProviderEnabled(auth.user.id, platform.data, false);
        break;
      case "disconnect":
      case "delete_credentials":
        await deleteMarketplaceCredentials(auth.user.id, platform.data);
        break;
      case "reset":
        await resetMarketplaceProviderSettings(auth.user.id, platform.data);
        break;
      case "reconnect":
        await retryMarketplaceConnection(auth.user.id, platform.data);
        break;
      case "health_check":
        await checkMarketplaceHealth(auth.user.id, platform.data);
        break;
      case "retry":
        await retryMarketplaceConnection(auth.user.id, platform.data);
        break;
      case "refresh_token":
        if (!isOAuthPlatform(platform.data)) {
          return NextResponse.json({ error: "This provider does not support OAuth refresh." }, { status: 400 });
        }
        await refreshOAuthTokens(auth.user.id, platform.data);
        break;
    }

    if (body.settings) {
      await updateMarketplaceProviderSettings(auth.user.id, platform.data, body.settings);
    }

    const provider = await getMarketplaceProviderView(auth.user.id, platform.data);
    return NextResponse.json({ provider });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid settings action." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update provider." },
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
    return NextResponse.json({ error: "Unknown marketplace provider." }, { status: 400 });
  }

  await deleteMarketplaceCredentials(auth.user.id, platform.data);
  const provider = await getMarketplaceProviderView(auth.user.id, platform.data);
  return NextResponse.json({ provider });
}

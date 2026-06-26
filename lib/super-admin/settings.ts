import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types/database";
import { toAuditLogMetadata } from "@/lib/audit/metadata";
import { auditSuperAdminAction } from "@/lib/super-admin/audit";

export type MaintenanceModeSettings = {
  enabled: boolean;
  message: string;
};

export type FeatureVisibilitySettings = {
  auctions: boolean;
  wholesale: boolean;
  voiceSearch: boolean;
};

export type PlatformAnnouncementSettings = {
  enabled: boolean;
  title: string;
  body: string;
  href: string;
};

export async function getPlatformSetting<T>(key: string, fallback: T): Promise<T> {
  const admin = createAdminClient();
  const { data } = await admin.from("platform_settings").select("value").eq("key", key).maybeSingle();
  if (!data?.value) return fallback;
  if (Array.isArray(data.value)) return data.value as T;
  if (typeof data.value === "object" && data.value !== null && !Array.isArray(fallback)) {
    return { ...fallback, ...(data.value as Record<string, unknown>) } as T;
  }
  return data.value as T;
}

export async function listPlatformSettings(): Promise<Record<string, Json>> {
  const admin = createAdminClient();
  const { data } = await admin.from("platform_settings").select("key, value");
  const entries = (data ?? []).map((row) => [row.key, row.value] as const);
  return Object.fromEntries(entries) as Record<string, Json>;
}

export async function updatePlatformSetting(input: {
  actorId: string;
  key: string;
  value: Json;
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("platform_settings").upsert({
    key: input.key,
    value: input.value,
    updated_at: new Date().toISOString(),
    updated_by: input.actorId,
  });

  if (error) {
    throw new Error(error.message);
  }

  await auditSuperAdminAction({
    actorId: input.actorId,
    action: "platform_settings.update",
    resourceType: "platform_settings",
    resourceId: input.key,
    metadata: toAuditLogMetadata(input.value),
  });
}

export async function isMaintenanceModeEnabled(): Promise<MaintenanceModeSettings> {
  return getPlatformSetting<MaintenanceModeSettings>("maintenance_mode", {
    enabled: false,
    message: "ROVEXO is undergoing scheduled maintenance. Please check back shortly.",
  });
}

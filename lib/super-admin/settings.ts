import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isDatabasePermissionError } from "@/lib/supabase/database-errors";
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

export class PlatformSettingsPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlatformSettingsPermissionError";
  }
}

function resolvePlatformSettingFallback<T>(fallback: T | (() => T)): T {
  return typeof fallback === "function" ? (fallback as () => T)() : fallback;
}

function isSelfContainedConfigDocument(value: Record<string, unknown>): boolean {
  return "settings" in value && "featureFlags" in value;
}

function getServiceRoleClient() {
  return createServiceRoleClient();
}

export async function getPlatformSetting<T>(key: string, fallback: T | (() => T)): Promise<T> {
  const admin = getServiceRoleClient();
  const { data, error } = await admin.from("platform_settings").select("value").eq("key", key).maybeSingle();

  if (error) {
    if (isDatabasePermissionError(error)) {
      return resolvePlatformSettingFallback(fallback);
    }
    throw new Error(error.message);
  }

  if (!data?.value) return resolvePlatformSettingFallback(fallback);
  if (Array.isArray(data.value)) return data.value as T;
  if (typeof data.value === "object" && data.value !== null) {
    const stored = data.value as Record<string, unknown>;
    if (isSelfContainedConfigDocument(stored)) {
      return stored as T;
    }
    const fallbackValue = resolvePlatformSettingFallback(fallback);
    if (!Array.isArray(fallbackValue) && typeof fallbackValue === "object" && fallbackValue !== null) {
      return { ...fallbackValue, ...stored } as T;
    }
    return stored as T;
  }
  return data.value as T;
}

export async function listPlatformSettings(): Promise<Record<string, Json>> {
  const admin = getServiceRoleClient();
  const { data, error } = await admin.from("platform_settings").select("key, value");

  if (error) {
    if (isDatabasePermissionError(error)) {
      return {};
    }
    throw new Error(error.message);
  }

  const entries = (data ?? []).map((row) => [row.key, row.value] as const);
  return Object.fromEntries(entries) as Record<string, Json>;
}

export async function updatePlatformSetting(input: {
  actorId: string;
  key: string;
  value: Json;
}): Promise<void> {
  const admin = getServiceRoleClient();
  const { error } = await admin.from("platform_settings").upsert({
    key: input.key,
    value: input.value,
    updated_at: new Date().toISOString(),
    updated_by: input.actorId,
  });

  if (error) {
    if (isDatabasePermissionError(error)) {
      throw new PlatformSettingsPermissionError(error.message);
    }
    throw new Error(error.message);
  }

  try {
    await auditSuperAdminAction({
      actorId: input.actorId,
      action: "platform_settings.update",
      resourceType: "platform_settings",
      resourceId: input.key,
      metadata: toAuditLogMetadata(input.value),
    });
  } catch {
    // Audit must not block platform settings persistence.
  }
}

export async function isMaintenanceModeEnabled(): Promise<MaintenanceModeSettings> {
  return getPlatformSetting<MaintenanceModeSettings>("maintenance_mode", {
    enabled: false,
    message: "ROVEXO is undergoing scheduled maintenance. Please check back shortly.",
  });
}

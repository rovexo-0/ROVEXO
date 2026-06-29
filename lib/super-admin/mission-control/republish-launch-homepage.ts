import { revalidatePath } from "next/cache";

import { resolvePublishedHomepageSections } from "@/lib/platform-visual/resolver";
import { createDefaultVisualBundle } from "@/lib/platform-visual/defaults";
import { PLATFORM_VISUAL_DRAFT_KEY } from "@/lib/platform-visual/keys";
import type { PlatformVisualBundle } from "@/lib/platform-visual/types";
import { createDefaultStudioProDocument } from "@/lib/platform-visual/studio-pro/defaults";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  createDefaultHomepageBuilderConfig,
  HOMEPAGE_BUILDER_SETTING_KEY,
} from "@/lib/super-admin/mission-control/defaults";
import type { HomepageBuilderConfig } from "@/lib/super-admin/mission-control/types";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import type { Json } from "@/lib/supabase/types/database";

export type RepublishLaunchHomepageResult = {
  homepageBuilder: HomepageBuilderConfig;
  publishedSectionIds: string[];
  updatedKeys: string[];
};

async function resolveRepublishActorId(explicitActorId?: string | null): Promise<string | null> {
  if (explicitActorId) return explicitActorId;

  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "super_admin")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

/** Writes approved launch homepage defaults to platform_settings and busts homepage cache. */
export async function republishLaunchHomepageDefaults(
  actorId?: string | null,
): Promise<RepublishLaunchHomepageResult> {
  const resolvedActorId = await resolveRepublishActorId(actorId);
  const homepageBuilder = createDefaultHomepageBuilderConfig();
  homepageBuilder.updatedAt = new Date().toISOString();

  const updatedKeys = [HOMEPAGE_BUILDER_SETTING_KEY];

  await updatePlatformSetting({
    actorId: resolvedActorId,
    key: HOMEPAGE_BUILDER_SETTING_KEY,
    value: homepageBuilder as unknown as Json,
  });

  const existingDraft = await getPlatformSetting<PlatformVisualBundle | null>(PLATFORM_VISUAL_DRAFT_KEY, null);

  if (existingDraft) {
    const nextBundle: PlatformVisualBundle = {
      ...existingDraft,
      label: "Live",
      updatedAt: homepageBuilder.updatedAt,
      homepageBuilder,
      studioPro: createDefaultStudioProDocument(homepageBuilder),
    };

    await updatePlatformSetting({
      actorId: resolvedActorId,
      key: PLATFORM_VISUAL_DRAFT_KEY,
      value: nextBundle as unknown as Json,
    });
    updatedKeys.push(PLATFORM_VISUAL_DRAFT_KEY);
  } else {
    const liveBundle = createDefaultVisualBundle("Live");
    liveBundle.updatedAt = homepageBuilder.updatedAt;
    liveBundle.homepageBuilder = homepageBuilder;

    await updatePlatformSetting({
      actorId: resolvedActorId,
      key: PLATFORM_VISUAL_DRAFT_KEY,
      value: liveBundle as unknown as Json,
    });
    updatedKeys.push(PLATFORM_VISUAL_DRAFT_KEY);
  }

  try {
    revalidatePath("/");
    revalidatePath("/", "layout");
  } catch {
    // CLI migrations run outside the Next.js request context.
  }

  const publishedSectionIds = resolvePublishedHomepageSections(homepageBuilder).map((section) => section.id);

  return {
    homepageBuilder,
    publishedSectionIds,
    updatedKeys,
  };
}

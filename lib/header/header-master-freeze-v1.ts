/**
 * ROVEXO HEADER MASTER FREEZE v1.0 — LEVEL 8
 * ONE Header · ONE Avatar Owner · ONE /api/profile (app load)
 * Forbidden: remount on navigation · second profile fetch · Camera/Search edits
 */

export const HEADER_MASTER_FREEZE_V1 = {
  version: "1.0",
  status: "LEVEL_8_ABSOLUTE_AUTHORITY",
  oneHeaderOnly: true,
  oneAvatarOwner: true,
  oneProfileFetchOnAppLoad: true,
  headerSurvivesNavigation: true,
  avatarSurvivesNavigation: true,
  forbidden: [
    "per-page RovexoHeaderV2 remount",
    "HeaderProfileLink local fetch on mount",
    "second /api/profile after router.replace",
    "Camera Search modifications",
    "SearchProvider modifications",
  ] as const,
  ssot: {
    freeze: "lib/header/header-master-freeze-v1.ts",
    auth: "features/auth/providers/AuthProvider.tsx",
    avatar: "features/auth/providers/AvatarProvider.tsx",
    header: "features/header/HeaderProvider.tsx",
    profileLink: "components/header/HeaderProfileLink.tsx",
  },
} as const;

export type HeaderMasterFreezeV1 = typeof HEADER_MASTER_FREEZE_V1;

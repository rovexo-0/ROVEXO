/**
 * ROVEXO Phase C.2 — Canonical Profile Avatar (v1.0).
 *
 * STATUS: ACTIVE · PROFILE PHOTO UX SSOT
 *
 * One camera badge · one action sheet · one upload pipeline (AvatarUploader handlers).
 * Surfaces: My Profile · Personal Information · Change Profile Picture.
 */

export const PHASE_C2_CANONICAL_PROFILE_AVATAR_V1 = {
  id: "phase-c2-canonical-profile-avatar-v1",
  version: "1.0.0",
  status: "ACTIVE",
  component: "features/profile/components/CanonicalProfileAvatar.tsx",
  css: "styles/rovexo/canonical-profile-avatar-v1.css",
  avatarPx: 104 as const,
  cameraButtonPx: 40 as const,
  minHitTargetPx: 44 as const,
  sheetActions: ["Take Photo", "Choose from Gallery", "Remove Photo", "Cancel"] as const,
  pipeline: "/api/profile/avatar" as const,
} as const;

export type PhaseC2CanonicalProfileAvatarV1 = typeof PHASE_C2_CANONICAL_PROFILE_AVATAR_V1;

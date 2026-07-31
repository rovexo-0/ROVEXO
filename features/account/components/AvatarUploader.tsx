"use client";

/**
 * AvatarUploader — thin alias of CanonicalProfileAvatar (Phase C.2 SSOT).
 * Prefer importing CanonicalProfileAvatar directly on new surfaces.
 */

import {
  CanonicalProfileAvatar,
  type CanonicalProfileAvatarHandle,
  type CanonicalProfileAvatarProps,
} from "@/features/profile/components/CanonicalProfileAvatar";

export type AvatarUploaderProps = CanonicalProfileAvatarProps;

export type AvatarUploaderHandle = CanonicalProfileAvatarHandle;

export function AvatarUploader(props: AvatarUploaderProps) {
  return <CanonicalProfileAvatar {...props} />;
}

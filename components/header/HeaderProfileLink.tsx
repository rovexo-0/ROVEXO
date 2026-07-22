"use client";

import { useAvatarOptional } from "@/features/auth/providers/AvatarProvider";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

/**
 * Header avatar — reads ONE AvatarProvider store. No local /api/profile fetch.
 */
export function HeaderProfileLink({
  className,
  avatarClassName,
  loadProfile = true,
}: {
  className?: string;
  avatarClassName?: string;
  loadProfile?: boolean;
}) {
  const avatar = useAvatarOptional();
  const name = loadProfile ? (avatar?.name ?? "Account") : "Account";
  const avatarUrl = loadProfile ? (avatar?.avatarUrl ?? null) : null;

  return (
    <Link
      href="/account"
      aria-label="Account"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-ds-full",
        transitionFast,
        "hover:opacity-90 active:scale-[0.94]",
        focusRing,
        className,
      )}
    >
      <Avatar
        src={avatarUrl}
        alt={name}
        name={name}
        size="header"
        className={avatarClassName}
      />
    </Link>
  );
}

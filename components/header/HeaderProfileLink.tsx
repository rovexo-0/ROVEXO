"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

export function HeaderProfileLink({ className }: { className?: string }) {
  const [profile, setProfile] = useState<{ name: string; avatarUrl: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/profile", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { profile?: { fullName?: string; avatarUrl?: string | null } } | null) => {
        if (!cancelled && payload?.profile) {
          setProfile({
            name: payload.profile.fullName ?? "Account",
            avatarUrl: payload.profile.avatarUrl ?? null,
          });
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link
      href="/account"
      aria-label="Account"
      className={cn(
        "inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-ds-full",
        transitionFast,
        "hover:opacity-90 active:scale-[0.94]",
        focusRing,
        className,
      )}
    >
      <Avatar
        src={profile?.avatarUrl}
        alt={profile?.name ?? "Account"}
        name={profile?.name}
        size="sm"
        className="ring-2 ring-background"
      />
    </Link>
  );
}

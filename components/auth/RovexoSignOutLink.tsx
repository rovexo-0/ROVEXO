"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { cleanupPushSubscriptionOnLogout } from "@/lib/push/logout-cleanup-v1";
import "@/styles/rovexo/sign-out.css";

type RovexoSignOutLinkProps = {
  className?: string;
  label?: string;
};

export function RovexoSignOutLink({ className, label = "Log out" }: RovexoSignOutLinkProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={cn("rovexo-sign-out", className)}
      onClick={() => {
        startTransition(async () => {
          await cleanupPushSubscriptionOnLogout();
          router.push("/auth/signout");
        });
      }}
    >
      <RovexoIcon icon={RovexoIcons.security.logout} variant="settings" className="rovexo-sign-out__icon" />
      <span>{pending ? "Signing out…" : label}</span>
    </button>
  );
}

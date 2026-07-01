"use client";

import { useTransition } from "react";
import { signOut } from "@/lib/auth/actions";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";

export function AccountCenterLogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={cn("account-center-logout", focusRing)}
      onClick={() => startTransition(() => void signOut())}
    >
      {pending ? "Signing out…" : "Log out"}
    </button>
  );
}

"use client";

import { useTransition } from "react";
import { clearClientSessionOnLogout } from "@/features/auth/providers/AuthProvider";
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
      onClick={() =>
        startTransition(() => {
          clearClientSessionOnLogout();
          void signOut();
        })
      }
    >
      {pending ? "Signing out…" : "Log out"}
    </button>
  );
}

"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import { ConfirmDialog } from "@/features/settings/components/ConfirmDialog";
import { SignOutIcon } from "@/features/profile/icons";
import { signOut } from "@/lib/auth/actions";

export function ProfileSignOutButton() {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      setLogoutOpen(false);
      await signOut();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setLogoutOpen(true)}
        disabled={pending}
        className={cn(
          "premium-btn premium-glass flex min-h-[56px] w-full items-center justify-center gap-ds-2 border border-danger/30 px-ds-4 py-ds-3 text-base font-semibold text-danger",
          transitionFast,
          focusRing,
        )}
      >
        <SignOutIcon className="h-5 w-5" />
        {pending ? "Signing out…" : "Sign Out"}
      </button>

      <ConfirmDialog
        open={logoutOpen}
        title="Log out?"
        description="You will need to sign in again to access your account, orders, and messages."
        confirmLabel="Log Out"
        cancelLabel="Cancel"
        onConfirm={handleSignOut}
        onCancel={() => setLogoutOpen(false)}
      />
    </>
  );
}

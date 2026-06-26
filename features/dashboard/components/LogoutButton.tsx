"use client";

import { useState, useTransition } from "react";
import { SignOutIcon } from "@/features/profile/icons";
import { ConfirmDialog } from "@/features/settings/components/ConfirmDialog";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
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
        className={cn("dash-v1-logout", focusRing, className)}
      >
        <SignOutIcon className="h-5 w-5" aria-hidden />
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

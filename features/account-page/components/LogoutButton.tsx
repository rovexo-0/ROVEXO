"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";
import { ConfirmDialog } from "@/features/settings/components/ConfirmDialog";
import { signOut } from "@/lib/auth/actions";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";

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
        className={cn("account-logout", focusRing, className)}
      >
        <LogOut size={20} strokeWidth={2} aria-hidden />
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

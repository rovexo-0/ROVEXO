"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuth } from "@/features/auth/providers/AuthProvider";
import { HEADER_MASTER_FREEZE_V1 } from "@/lib/header/header-master-freeze-v1";

type AvatarContextValue = {
  avatarUrl: string | null;
  name: string;
  ready: boolean;
  loading: boolean;
};

const AvatarContext = createContext<AvatarContextValue | null>(null);

/**
 * ONE Avatar Owner — shares AuthProvider profile. Zero remount fetches.
 */
export function AvatarProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  const value = useMemo<AvatarContextValue>(() => {
    void HEADER_MASTER_FREEZE_V1.oneAvatarOwner;
    return {
      avatarUrl: auth.profile?.avatarUrl ?? null,
      name: auth.profile?.fullName?.trim() || "Account",
      ready: auth.ready,
      loading: auth.loading,
    };
  }, [auth.profile?.avatarUrl, auth.profile?.fullName, auth.ready, auth.loading]);

  return <AvatarContext.Provider value={value}>{children}</AvatarContext.Provider>;
}

export function useAvatar(): AvatarContextValue {
  const context = useContext(AvatarContext);
  if (!context) {
    throw new Error("useAvatar must be used within AvatarProvider");
  }
  return context;
}

export function useAvatarOptional(): AvatarContextValue | null {
  return useContext(AvatarContext);
}

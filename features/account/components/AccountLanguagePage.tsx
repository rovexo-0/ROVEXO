"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Language page REMOVED — English (UK) only. */
export function AccountLanguagePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/account/settings");
  }, [router]);
  return null;
}

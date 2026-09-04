"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SELLER_CONTEXT_CHANGED_EVENT } from "@/lib/business/switch-seller-context-client";

/**
 * Re-resolve Help audience from the server after Individual ↔ Business switch.
 * Does not treat the client event as content authority.
 */
export function useRefreshHelpOnSellerContextChange(): void {
  const router = useRouter();

  useEffect(() => {
    const onChanged = () => {
      router.refresh();
    };
    window.addEventListener(SELLER_CONTEXT_CHANGED_EVENT, onChanged);
    return () => {
      window.removeEventListener(SELLER_CONTEXT_CHANGED_EVENT, onChanged);
    };
  }, [router]);
}

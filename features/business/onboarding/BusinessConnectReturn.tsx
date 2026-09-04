"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";
import "@/styles/rovexo/business-onboarding-v1.css";

export function BusinessConnectReturn() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function reconcile() {
      try {
        const response = await fetch("/api/business/status?refresh=1", {
          credentials: "include",
          cache: "no-store",
        });
        if (response.status === 401) {
          router.replace("/login?next=/business/connect/return");
          return;
        }
        const json = (await response.json()) as {
          status?: {
            stripe?: { verified?: boolean; state?: string };
            hasBusinessProfile?: boolean;
            nextStep?: string;
          };
        };
        if (cancelled) return;
        if (json.status?.stripe?.verified) {
          router.replace("/business/active");
          return;
        }
        if (!json.status?.hasBusinessProfile) {
          router.replace("/business/information");
          return;
        }
        router.replace("/business/connect?stage=onboarding");
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    void reconcile();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (failed) {
    return <FailClosedPanel onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="biz-flow" data-business-connect-return="v1">
      <p className="biz-flow__copy">Returning from Stripe…</p>
    </div>
  );
}

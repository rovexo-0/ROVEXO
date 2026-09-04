"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CanonicalMenuRow } from "@/src/components/canonical";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { useToast } from "@/components/ui/Toast";
import { PROFILE_ICON_SIZE_PX } from "@/lib/account-center/profile-icon-system-v1";
import { BUSINESS_DASHBOARD_ROUTE } from "@/lib/business/access";
import {
  accountBusinessEntryHref,
  resolveProfileBusinessAction,
  type BusinessStatusSnapshot,
  type ProfileBusinessStatusInput,
} from "@/lib/business/business-onboarding-contract-v1";
import {
  applyConfirmedSellerContextHint,
  navigateAfterSellerContextSwitch,
  requestSellerContextSwitch,
  SELLER_CONTEXT_CHANGED_EVENT,
} from "@/lib/business/switch-seller-context-client";

type BusinessUpgradeCardProps = {
  initialStatus?: ProfileBusinessStatusInput | null;
};

function toStatusInput(
  value: ProfileBusinessStatusInput | BusinessStatusSnapshot | null | undefined,
): ProfileBusinessStatusInput | null {
  if (!value) return null;
  return {
    hasBusinessProfile: value.hasBusinessProfile,
    stripe: value.stripe,
    activeSellerContext: value.activeSellerContext,
  };
}

export function BusinessUpgradeCard({ initialStatus = null }: BusinessUpgradeCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { pushToast } = useToast();
  const [liveStatus, setLiveStatus] = useState<ProfileBusinessStatusInput | null>(() =>
    applyConfirmedSellerContextHint(toStatusInput(initialStatus)),
  );
  const [busy, setBusy] = useState(false);
  const switchLock = useRef(false);
  const statusInFlight = useRef<Promise<void> | null>(null);
  const status = liveStatus ?? toStatusInput(initialStatus);
  const action = resolveProfileBusinessAction(status);

  const refreshStatus = useCallback(() => {
    if (statusInFlight.current) return statusInFlight.current;
    const run = (async () => {
      try {
        const response = await fetch("/api/business/status", {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) return;
        const json = (await response.json()) as { status?: BusinessStatusSnapshot };
        const next = toStatusInput(json.status);
        if (next) setLiveStatus(next);
      } catch {
        /* Keep last known canonical snapshot. */
      }
    })();
    statusInFlight.current = run.finally(() => {
      statusInFlight.current = null;
    });
    return statusInFlight.current;
  }, []);

  useEffect(() => {
    if (pathname !== "/account") return;
    void refreshStatus();
  }, [pathname, refreshStatus]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshStatus();
    };
    const onPageShow = () => {
      void refreshStatus();
    };
    const onContextChanged = (event: Event) => {
      const context = (event as CustomEvent<{ activeSellerContext?: unknown }>).detail
        ?.activeSellerContext;
      if (context !== "individual" && context !== "business") return;
      setLiveStatus((current) => {
        const base = current ?? toStatusInput(initialStatus);
        return base ? { ...base, activeSellerContext: context } : current;
      });
    };

    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener(SELLER_CONTEXT_CHANGED_EVENT, onContextChanged);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener(SELLER_CONTEXT_CHANGED_EVENT, onContextChanged);
    };
  }, [initialStatus, refreshStatus]);

  useEffect(() => {
    if (action.kind === "switch-to-business") {
      router.prefetch(BUSINESS_DASHBOARD_ROUTE);
    }
  }, [action.kind, router]);

  async function switchContext() {
    if (busy || switchLock.current || action.kind === "upgrade") return;
    const nextContext = action.kind === "switch-to-business" ? "business" : "individual";
    switchLock.current = true;
    setBusy(true);
    try {
      const result = await requestSellerContextSwitch(nextContext);
      if (!result.ok) {
        pushToast({ title: result.error, variant: "error" });
        switchLock.current = false;
        setBusy(false);
        return;
      }
      setLiveStatus((current) => {
        const base = current ?? toStatusInput(initialStatus);
        return base ? { ...base, activeSellerContext: result.activeSellerContext } : current;
      });
      startTransition(() => {
        navigateAfterSellerContextSwitch(router, result.activeSellerContext, pathname);
      });
      if (result.activeSellerContext === "individual") {
        switchLock.current = false;
        setBusy(false);
      }
    } catch {
      pushToast({ title: "Unable to switch seller context.", variant: "error" });
      switchLock.current = false;
      setBusy(false);
    }
  }

  return (
    <div
      data-business-upgrade-card="v1"
      data-profile-business-action={action.kind}
      data-business-complete={action.kind === "upgrade" ? "false" : "true"}
      style={{ display: "contents" }}
    >
      <CanonicalMenuRow
        id="ac-canonical-business-action"
        className="cds-menu-row--business-action"
        title={action.title}
        href={action.kind === "upgrade" ? accountBusinessEntryHref(status) : undefined}
        onClick={action.kind === "upgrade" ? undefined : () => void switchContext()}
        disabled={busy}
        prefetch={action.kind === "upgrade"}
        icon={
          <span className="ac-canonical__menu-icon ac-canonical__menu-emoji" aria-hidden>
            <PlatformEmoji emoji={action.emoji} width={PROFILE_ICON_SIZE_PX} height={PROFILE_ICON_SIZE_PX} />
          </span>
        }
        ariaLabel={action.title}
      />
    </div>
  );
}

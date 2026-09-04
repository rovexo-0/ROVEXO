"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";
import { PWA_BUSINESS_MENU_ITEMS } from "@/lib/business/pwa-business-menu-v1";
import {
  navigateAfterSellerContextSwitch,
  requestSellerContextSwitch,
} from "@/lib/business/switch-seller-context-client";
import "@/styles/rovexo/business-onboarding-v1.css";

type BusinessMenuScreenProps = {
  storeHref: string;
  walletLabel?: string | null;
};

export function BusinessMenuScreen({ storeHref, walletLabel }: BusinessMenuScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function switchToIndividual() {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await requestSellerContextSwitch("individual");
      if (!result.ok) {
        setMessage(result.error);
        setBusy(false);
        return;
      }
      startTransition(() => {
        navigateAfterSellerContextSwitch(router, result.activeSellerContext, pathname);
      });
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }

  if (failed) {
    return <FailClosedPanel onRetry={() => setFailed(false)} />;
  }

  return (
    <div className="biz-menu" data-business-menu="v1" data-business-menu-icons="emoji">
      {PWA_BUSINESS_MENU_ITEMS.map((item) => {
        const href = item.id === "store" ? storeHref : item.href;
        const value =
          item.value ??
          (item.id === "wallet" && walletLabel ? walletLabel : undefined);
        if (item.comingSoon || !href) {
          return (
            <div
              key={item.id}
              className="biz-menu__row biz-menu__row--coming-soon"
              aria-disabled="true"
            >
              <span className="biz-menu__emoji" aria-hidden>
                {item.emoji}
              </span>
              <span className="biz-menu__title">{item.title}</span>
              {value ? <span className="biz-home__pending">{value}</span> : null}
              <span className="biz-menu__chevron" aria-hidden>
                ›
              </span>
            </div>
          );
        }
        return (
          <Link key={item.id} href={href} className="biz-menu__row">
            <span className="biz-menu__emoji" aria-hidden>
              {item.emoji}
            </span>
            <span className="biz-menu__title">{item.title}</span>
            {value ? <span className="biz-home__pending">{value}</span> : null}
            <span className="biz-menu__chevron" aria-hidden>
              ›
            </span>
          </Link>
        );
      })}
      {message ? <p className="biz-flow__error">{message}</p> : null}
      <button
        type="button"
        className="biz-menu__switch"
        onClick={() => void switchToIndividual()}
        disabled={busy}
      >
        👤 Switch to Individual
      </button>
    </div>
  );
}

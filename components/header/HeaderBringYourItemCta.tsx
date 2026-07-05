"use client";

import Link from "next/link";
import { BRING_YOUR_ITEM_PATH } from "@/lib/bring-your-item/paths";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import "./header-bring-your-item-cta.css";

export function HeaderBringYourItemCta({ className }: { className?: string }) {
  return (
    <Link
      href={BRING_YOUR_ITEM_PATH}
      className={cn("rx-header-bring-item-cta", focusRing, className)}
      aria-label="Bring your item — import listings"
    >
      <span className="rx-header-bring-item-cta__icon" aria-hidden>
        🚀
      </span>
      <span className="rx-header-bring-item-cta__label">Bring your item</span>
    </Link>
  );
}

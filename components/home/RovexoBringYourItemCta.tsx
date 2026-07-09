"use client";

import Link from "next/link";
import { BRING_YOUR_ITEM_PATH } from "@/lib/bring-your-item/paths";
import { isBringYourItemEnabled } from "@/lib/bring-your-item/release";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

export function RovexoBringYourItemCta({ className }: { className?: string }) {
  if (!isBringYourItemEnabled()) return null;

  return (
    <section aria-label="Bring your item" className={cn("home-v1-bring-item", className)}>
      <div className="home-v1-bring-item__copy">
        <p className="home-v1-bring-item__title">Bring your listings to ROVEXO</p>
        <p className="home-v1-bring-item__subtitle">Import from eBay, Etsy, Vinted and more</p>
      </div>
      <Link
        href={BRING_YOUR_ITEM_PATH}
        className={cn("home-v1-bring-item__cta", focusRing)}
      >
        Import listings
      </Link>
    </section>
  );
}

"use client";

import Link from "next/link";
import { BRING_YOUR_ITEM_PATH } from "@/lib/bring-your-item/paths";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

export function HomepageV3BringYourItem() {
  return (
    <section aria-label="Bring your item" className="hp3-bring-item">
      <div className="hp3-bring-item__copy">
        <p className="hp3-bring-item__title">Bring your listings to ROVEXO</p>
        <p className="hp3-bring-item__subtitle">Import from eBay, Etsy, Vinted and more</p>
      </div>
      <Link href={BRING_YOUR_ITEM_PATH} className={cn("hp3-bring-item__cta", focusRing)}>
        Import listings
      </Link>
    </section>
  );
}

"use client";

import Link from "next/link";
import { BRING_YOUR_ITEM_PATH } from "@/lib/bring-your-item/paths";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";

export function HomepageV4BringYourItem() {
  return (
    <section aria-label="Bring your item" className="rx4-import">
      <div className="rx4-import__content">
        <RovexoIcon icon={RovexoIcons.dashboard.listings} variant="header" className="rx4-import__icon" />
        <div className="rx4-import__copy">
          <p className="rx4-import__title">Bring your item</p>
        </div>
      </div>
      <Link href={BRING_YOUR_ITEM_PATH} className={cn("rx4-import__action", focusRing)}>
        Start
      </Link>
    </section>
  );
}

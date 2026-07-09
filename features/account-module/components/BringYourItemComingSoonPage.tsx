import Link from "next/link";
import { AccountModuleShell } from "@/features/account-module/components/AccountModuleShell";
import { buttonSizes, buttonVariants } from "@/components/ui/variants";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

export function BringYourItemComingSoonPage() {
  return (
    <AccountModuleShell title="Bring Your Item" backHref="/account">
      <div className="acm-byi" data-bring-your-item-version="v1.0-coming-soon">
        <div className="acm-byi__section acm-byi__section--centered">
          <p className="acm-byi__coming-soon-badge">Coming Soon</p>
          <h2 className="acm-byi__section-title">Import from eBay</h2>
          <p className="acm-byi__subtitle">
            Bring Your Item is finishing production certification. Marketplace buying, selling,
            checkout, and orders are unaffected.
          </p>
          <Link
            href="/account"
            className={cn(buttonVariants.primary, buttonSizes.lg, "w-full", focusRing)}
          >
            Back to My Account
          </Link>
        </div>
      </div>
    </AccountModuleShell>
  );
}

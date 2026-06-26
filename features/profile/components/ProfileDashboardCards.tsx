import Link from "next/link";
import { DashboardIcon3D, resolveDashboardIconType } from "@/components/icons/DashboardIcon3D";
import { DashboardGrid } from "@/features/dashboard/components/DashboardGrid";
import { DashboardSection } from "@/features/dashboard/components/DashboardSection";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { ChevronRightIcon } from "@/features/product-detail/icons";

const QUICK_LINKS = [
  { href: "/orders", label: "Orders", subtitle: "Track purchases" },
  { href: "/saved", label: "Saved", subtitle: "Wishlist items" },
  { href: "/trust", label: "Trust Centre", subtitle: "Score & safety" },
  { href: "/resolution", label: "Resolution Centre", subtitle: "Disputes & cases" },
  { href: "/assistant", label: "AI Assistant", subtitle: "Help & guidance" },
  { href: "/support", label: "Support", subtitle: "Contact us" },
  { href: "/plans", label: "Premium Plans", subtitle: "Subscriptions" },
] as const;

export function ProfileDashboardCards() {
  return (
    <DashboardSection id="profile-dashboard-heading" title="Dashboard">
      <DashboardGrid>
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn("dash-v1-tile", focusRing)}
            aria-label={`${link.label}. ${link.subtitle}`}
          >
            <div className="dash-v1-tile__top">
              <div className="dash-v1-tile__icon">
                <DashboardIcon3D type={resolveDashboardIconType(link.href)} size={32} />
              </div>
              <ChevronRightIcon className="dash-v1-tile__chevron h-4 w-4 shrink-0" aria-hidden />
            </div>
            <div>
              <p className="dash-v1-tile__title">{link.label}</p>
              <p className="dash-v1-tile__subtitle">{link.subtitle}</p>
            </div>
          </Link>
        ))}
      </DashboardGrid>
    </DashboardSection>
  );
}

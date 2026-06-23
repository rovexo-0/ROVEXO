import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PremiumIcon } from "@/components/icons/PremiumIcon";
import {
  HelpMenuIcon,
  MessagesMenuIcon,
  OrdersMenuIcon,
  WalletMenuIcon,
} from "@/features/profile/icons";

const QUICK_LINKS = [
  { href: "/orders", label: "Orders", subtitle: "Track purchases", icon: OrdersMenuIcon },
  { href: "/saved", label: "Saved", subtitle: "Wishlist items", icon: OrdersMenuIcon },
  { href: "/trust", label: "Trust Centre", subtitle: "Score & safety", icon: HelpMenuIcon },
  { href: "/resolution", label: "Resolution Centre", subtitle: "Disputes & cases", icon: HelpMenuIcon },
  { href: "/assistant", label: "AI Assistant", subtitle: "Help & guidance", icon: HelpMenuIcon },
  { href: "/support", label: "Support", subtitle: "Contact us", icon: MessagesMenuIcon },
  { href: "/plans", label: "Premium Plans", subtitle: "Subscriptions", icon: WalletMenuIcon },
] as const;

export function ProfileDashboardCards() {
  return (
    <section aria-labelledby="profile-dashboard-heading">
      <h2 id="profile-dashboard-heading" className="text-base font-semibold text-text-primary">
        Dashboard
      </h2>
      <div className="mt-ds-3 grid grid-cols-2 gap-ds-2 sm:grid-cols-3">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card padding="sm" interactive className="h-full min-h-[92px]">
                <PremiumIcon size="sm" glow>
                  <Icon className="h-5 w-5 text-primary" />
                </PremiumIcon>
                <p className="mt-ds-2 text-sm font-semibold text-text-primary">{link.label}</p>
                <p className="mt-ds-0.5 line-clamp-2 text-xs text-text-secondary">{link.subtitle}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

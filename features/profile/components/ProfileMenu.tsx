import { Card } from "@/components/ui/Card";
import { HeartIcon } from "@/features/product-detail/icons";
import { ProfileMenuRow } from "@/features/profile/components/ProfileMenuRow";
import {
  AboutMenuIcon,
  HelpMenuIcon,
  MessagesMenuIcon,
  NotificationsMenuIcon,
  OrdersMenuIcon,
  SettingsIcon,
} from "@/features/profile/icons";
import { BETA_VERSION } from "@/lib/beta/roadmap";
import {
  ADMIN_NAV,
  BUSINESS_NAV,
  BUYER_NAV,
  SELLER_NAV,
  SHARED_NAV,
  type NavLink,
} from "@/lib/navigation/map";
import type { UserProfile } from "@/lib/profile/types";

type ProfileMenuProps = {
  profile: UserProfile;
};

function MenuSection({ title, links }: { title: string; links: NavLink[] }) {
  if (!links.length) return null;

  return (
    <div className="border-t border-border">
      <p className="px-ds-4 pb-ds-1 pt-ds-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
        {title}
      </p>
      {links.map((link) => (
        <ProfileMenuRow
          key={link.href}
          title={link.label}
          subtitle={link.subtitle}
          href={link.href}
          icon={<HelpMenuIcon className="h-5 w-5" />}
        />
      ))}
    </div>
  );
}

export function ProfileMenu({ profile }: ProfileMenuProps) {
  const buyerLinks = BUYER_NAV.filter(
    (link) => !["/orders", "/saved"].includes(link.href),
  );
  const sharedLinks = SHARED_NAV.filter(
    (link) => !["/messages", "/notifications", "/settings"].includes(link.href),
  );

  return (
    <Card padding="none" className="overflow-hidden shadow-ds-soft">
      <nav aria-label="Profile menu">
        <ProfileMenuRow
          title="Orders"
          subtitle="Track & manage orders"
          href="/orders"
          icon={<OrdersMenuIcon className="h-5 w-5" />}
        />

        <div className="border-t border-border">
          <ProfileMenuRow
            title="Cart"
            subtitle="Items ready to checkout"
            href="/cart"
            icon={<OrdersMenuIcon className="h-5 w-5" />}
          />
        </div>

        <div className="border-t border-border">
          <ProfileMenuRow
            title="Saved"
            subtitle="Your saved items"
            href="/saved"
            icon={<HeartIcon className="h-5 w-5 text-danger" filled />}
            iconClassName="text-danger"
          />
        </div>

        <div className="border-t border-border">
          <ProfileMenuRow
            title="Messages"
            href="/messages"
            icon={<MessagesMenuIcon className="h-5 w-5" />}
            badge={profile.unreadMessages}
          />
        </div>

        <div className="border-t border-border">
          <ProfileMenuRow
            title="Notifications"
            href="/notifications"
            icon={<NotificationsMenuIcon className="h-5 w-5" />}
            badge={profile.unreadNotifications}
          />
        </div>

        <MenuSection title="Buyer Dashboard" links={buyerLinks} />

        {profile.isSeller ? <MenuSection title="Seller Dashboard" links={SELLER_NAV} /> : null}

        {profile.accountType === "business" || profile.isAdmin ? (
          <MenuSection title="Business Dashboard" links={BUSINESS_NAV} />
        ) : null}

        <MenuSection title="Account" links={sharedLinks} />

        {profile.isAdmin ? <MenuSection title="Administration" links={ADMIN_NAV} /> : null}

        <div className="border-t border-border">
          <ProfileMenuRow
            title="Settings"
            subtitle="Preferences & privacy"
            href="/settings"
            icon={<SettingsIcon className="h-5 w-5" />}
          />
        </div>

        <div className="border-t border-border">
          <ProfileMenuRow
            title="About ROVEXO"
            subtitle={`Version ${BETA_VERSION}`}
            icon={<AboutMenuIcon className="h-5 w-5" />}
          />
        </div>
      </nav>
    </Card>
  );
}

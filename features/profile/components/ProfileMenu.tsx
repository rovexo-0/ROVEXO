import { Card } from "@/components/ui/Card";
import { HeartIcon } from "@/features/product-detail/icons";
import { ProfileMenuRow } from "@/features/profile/components/ProfileMenuRow";
import {
  AboutMenuIcon,
  HelpMenuIcon,
  ListingsIcon,
  MessagesMenuIcon,
  NotificationsMenuIcon,
  OrdersMenuIcon,
  SettingsIcon,
  WalletMenuIcon,
} from "@/features/profile/icons";
import { BETA_VERSION } from "@/lib/beta/roadmap";
import type { UserProfile } from "@/lib/profile/types";

type ProfileMenuProps = {
  profile: UserProfile;
};

export function ProfileMenu({ profile }: ProfileMenuProps) {
  return (
    <Card padding="none" className="overflow-hidden shadow-ds-soft">
      <nav aria-label="Profile menu">
        <ProfileMenuRow
          title="Orders"
          subtitle="Track & manage orders"
          href="/orders"
          icon={<OrdersMenuIcon className="h-5 w-5" />}
        />

        {profile.isSeller && (
          <div className="border-t border-border">
            <ProfileMenuRow
              title="My Listings"
              subtitle="Manage your items"
              href="/seller/listings"
              icon={<ListingsIcon className="h-5 w-5" />}
            />
          </div>
        )}

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

        {profile.isSeller && (
          <div className="border-t border-border">
            <ProfileMenuRow
              title="Wallet"
              subtitle="Balance & Transactions"
              href="/seller/wallet"
              icon={<WalletMenuIcon className="h-5 w-5" />}
            />
          </div>
        )}

        <div className="border-t border-border">
          <ProfileMenuRow
            title="Settings"
            subtitle="Preferences & Privacy"
            href="/settings"
            icon={<SettingsIcon className="h-5 w-5" />}
          />
        </div>

        <div className="border-t border-border">
          <ProfileMenuRow
            title="Help Centre"
            subtitle="Support"
            icon={<HelpMenuIcon className="h-5 w-5" />}
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

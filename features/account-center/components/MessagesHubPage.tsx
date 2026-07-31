"use client";

import { MasterMenuIcon } from "@/features/account-center/components/MasterMenuIcon";
import { AccountCanonicalShell } from "@/features/account-canonical";
import {
  buildMessagesMenuSections,
  MESSAGES_HUB_INTRO,
  type MessagesMenuItem,
} from "@/lib/account-center/messages-menu";
import { resolveHubMenuIconColor } from "@/lib/design-system/master-icon-system-v1";
import { CanonicalCard, CanonicalMenuRow } from "@/src/components/canonical";
import { useTranslation } from "@/lib/i18n/use-translation";

function MessagesMenuNav({ items }: { items: MessagesMenuItem[] }) {
  const { tx } = useTranslation();
  return (
    <nav className="ac-canonical__menu" aria-label={tx("Messages")}>
      <div className="cds-section">
        <CanonicalCard variant="list">
          {items.map((item) => (
            <CanonicalMenuRow
              key={item.id}
              id={`messages-${item.id}`}
              href={item.href}
              title={item.title}
              icon={<MasterMenuIcon icon={item.icon} color={resolveHubMenuIconColor(item.icon)} />}
            />
          ))}
        </CanonicalCard>
      </div>
    </nav>
  );
}

/** Messages = Transaction Hub (Vinted philosophy — not a chat app). */
export function MessagesHubPage() {
  const items = buildMessagesMenuSections().flatMap((section) => section.items);
  return (
    <AccountCanonicalShell
      title="Messages"
      backHref="/account"
      backLabel="My Account"
      showHeaderTitle
      intro={MESSAGES_HUB_INTRO}
    >
      <div data-transaction-hub="v1.0">
        <MessagesMenuNav items={items} />
      </div>
    </AccountCanonicalShell>
  );
}

"use client";

import { AccountIcon } from "@/components/account/AccountIcons";
import { AccountCanonicalShell } from "@/features/account-canonical";
import {
  buildMessagesMenuSections,
  MESSAGES_HUB_INTRO,
  type MessagesMenuItem,
} from "@/lib/account-center/messages-menu";
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
              icon={
                <span className="ac-canonical__menu-icon" aria-hidden>
                  <AccountIcon name={item.icon} />
                </span>
              }
            />
          ))}
        </CanonicalCard>
      </div>
    </nav>
  );
}

/** Messages hub — same Master Menu Design as My Account. */
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
      <MessagesMenuNav items={items} />
    </AccountCanonicalShell>
  );
}

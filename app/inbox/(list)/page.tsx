import { Suspense } from "react";
import { redirect } from "next/navigation";
import { InboxPage } from "@/features/inbox/components/InboxPage";
import { resolveOrderConversationHrefForUser } from "@/lib/orders/resolve-order-conversation-href.server";
import { getProfile } from "@/lib/profile/data";

export const dynamic = "force-dynamic";

type InboxRouteProps = {
  searchParams: Promise<{
    order?: string;
    focus?: string;
    tab?: string;
  }>;
};

function InboxFallback() {
  return (
    <div className="inbox-hub" aria-busy="true" aria-label="Loading inbox">
      <div className="inbox-hub__tabs" />
      <ul className="inbox-hub__list" aria-hidden>
        {Array.from({ length: 6 }).map((_, index) => (
          <li key={index} className="inbox-hub__skel inbox-hub__skel--card" />
        ))}
      </ul>
    </div>
  );
}

/**
 * Phase A1 — `/inbox?order=` never paints Inbox then redirects.
 * Server-resolves Order → Conversation Hub in one hop when possible.
 */
export default async function InboxRoute({ searchParams }: InboxRouteProps) {
  const sp = await searchParams;
  const orderId = sp.order?.trim();

  if (orderId) {
    const profile = await getProfile();
    const href = await resolveOrderConversationHrefForUser(orderId, profile.id, {
      focus: sp.focus === "tracking" ? "tracking" : undefined,
    });
    // Only hop when Conversation is known — avoid /inbox?order= redirect loops.
    if (href.includes("/inbox/conversation/")) {
      redirect(href);
    }
  }

  return (
    <Suspense fallback={<InboxFallback />}>
      <InboxPage />
    </Suspense>
  );
}

export async function generateMetadata() {
  return {
    title: "Inbox | ROVEXO",
    description: "ROVEXO Inbox — messages and notifications in one place.",
    robots: { index: false, follow: false },
  };
}

import { AccountCanonicalShell } from "@/features/account-canonical";

/**
 * Instant-feel route fallback for /inbox (Absolute Blood Law RUN #6).
 * User must never wait on a blank document — chrome + skeleton paint immediately.
 */
export default function InboxLoading() {
  return (
    <AccountCanonicalShell title="Inbox" backHref="/">
      <div className="inbox-hub" role="status" aria-busy="true" aria-label="Loading inbox" data-skeleton="inbox">
        <div className="inbox-hub__tabs" />
        <ul className="inbox-hub__list" aria-hidden>
          {Array.from({ length: 6 }).map((_, index) => (
            <li key={index} className="inbox-hub__skel inbox-hub__skel--card" />
          ))}
        </ul>
      </div>
    </AccountCanonicalShell>
  );
}

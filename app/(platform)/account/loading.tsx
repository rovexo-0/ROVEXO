import { AccountCanonicalShell } from "@/features/account-canonical";

/**
 * Instant-feel Profile fallback — chrome + skeleton before account data.
 * Absolute Blood Law RUN #6 · visible page ≤ 300ms.
 */
export default function AccountLoading() {
  return (
    <AccountCanonicalShell title="Profile" backHref="/">
      <div
        className="ac-canonical"
        role="status"
        aria-busy="true"
        aria-label="Loading profile"
        data-skeleton="account"
      >
        <div className="flex flex-col gap-4 px-6 pt-2" aria-hidden>
          <div className="rx-skeleton h-16 w-16 rounded-full" />
          <div className="rx-skeleton h-4 w-40 rounded-md" />
          <div className="rx-skeleton h-3 w-28 rounded-md" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rx-skeleton h-14 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </AccountCanonicalShell>
  );
}

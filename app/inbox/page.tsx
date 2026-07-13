import { Suspense } from "react";
import { InboxPage } from "@/features/inbox/components/InboxPage";

export const dynamic = "force-dynamic";

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

export default function InboxRoute() {
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

"use client";

import Link from "next/link";

type HelpAssistantProps = {
  compact?: boolean;
};

/**
 * Consumer AI Help Assistant removed (NO AI policy).
 * Retained export so legacy imports resolve to Contact Support only.
 */
export function HelpAssistant(_props: HelpAssistantProps = {}) {
  return (
    <p className="text-sm text-text-secondary">
      Need help?{" "}
      <Link href="/support" className="font-medium text-primary underline">
        Contact Support
      </Link>{" "}
      or{" "}
      <Link href="/help" className="font-medium text-primary underline">
        browse Help Centre
      </Link>
      .
    </p>
  );
}

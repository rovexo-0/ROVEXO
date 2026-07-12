"use client";

import { CanonicalButton, CanonicalButtonLink, CanonicalCard, CanonicalInfoBlock, CanonicalSection } from "@/src/components/canonical";
import Link from "next/link";

import {
  canAccessSupport,
  markResolution,
  readHelpSession,
  resetHelpSession,
  trackHelpEvent,
  writeHelpSession,
} from "@/lib/help/session";
import type { HelpTopicSlug } from "@/lib/help/types";

type HelpResolutionPromptProps = {
  topicSlug: HelpTopicSlug;
};

export function HelpResolutionPrompt({ topicSlug }: HelpResolutionPromptProps) {
  const session = readHelpSession();

  const handleYes = () => {
    const next = markResolution(session, true);
    writeHelpSession(next);
    void trackHelpEvent({ type: "resolution_yes", topicSlug });
  };

  const handleNo = () => {
    const next = markResolution(session, false);
    writeHelpSession(next);
    void trackHelpEvent({ type: "resolution_no", topicSlug });
  };

  const supportAllowed = canAccessSupport(readHelpSession());

  return (
    <CanonicalSection title="Did this solve your problem?">
      <CanonicalCard variant="medium">
        <div className="flex flex-wrap gap-ds-2 p-ds-4">
          <CanonicalButtonLink href="/help" variant="secondary" onClick={handleYes}>
            Yes — return home
          </CanonicalButtonLink>
          <CanonicalButton variant="secondary" onClick={handleNo}>
            No — need more help
          </CanonicalButton>
        </div>

        {session.resolved === false ? (
          <div className="space-y-ds-3 border-t border-[var(--cds-color-divider)] p-ds-4">
            <p className="cds-menu-row__title">More solutions</p>
            <ul className="space-y-ds-2 cds-menu-row__subtitle">
              <li>
                <Link href={`/help/category/${topicSlug}`} className="text-primary hover:opacity-80">
                  Start guided troubleshooting again
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-primary hover:opacity-80">
                  Browse all help topics
                </Link>
              </li>
            </ul>

            {supportAllowed ? (
              <CanonicalButtonLink
                href={`/support?topic=${topicSlug}&guided=1`}
                onClick={() => void trackHelpEvent({ type: "support_gate_pass", topicSlug })}
              >
                Contact Support
              </CanonicalButtonLink>
            ) : (
              <CanonicalInfoBlock variant="warning">
                Complete the guided troubleshooting flow and select <strong>No</strong> before contacting
                Support. This helps us resolve your issue faster.
                <CanonicalButton
                  variant="ghost"
                  className="mt-ds-2"
                  onClick={() => {
                    resetHelpSession();
                    window.location.reload();
                  }}
                >
                  Restart guided troubleshooting
                </CanonicalButton>
              </CanonicalInfoBlock>
            )}
          </div>
        ) : null}
      </CanonicalCard>
    </CanonicalSection>
  );
}

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
    <Card padding="lg">
      <h2 className="text-lg font-semibold text-text-primary">Did this solve your problem?</h2>
      <div className="mt-ds-4 flex flex-wrap gap-ds-2">
        <Link
          href="/help"
          onClick={handleYes}
          className="rx-chip inline-flex min-h-ds-7 items-center px-ds-5 text-sm font-semibold text-text-primary"
        >
          Yes — return home
        </Link>
        <Button variant="secondary" onClick={handleNo}>
          No — need more help
        </Button>
      </div>

      {session.resolved === false && (
        <div className="mt-ds-5 space-y-ds-3 border-t border-border pt-ds-5">
          <h3 className="text-sm font-semibold text-text-primary">More solutions</h3>
          <ul className="space-y-ds-2 text-sm text-text-secondary">
            <li>
              <Link href={`/help/category/${topicSlug}`} className="text-primary hover:underline">
                Start guided troubleshooting again
              </Link>
            </li>
            <li>
              <Link href="/help" className="text-primary hover:underline">
                Browse all help topics
              </Link>
            </li>
          </ul>

          {supportAllowed ? (
            <Link
              href={`/support?topic=${topicSlug}&guided=1`}
              onClick={() => void trackHelpEvent({ type: "support_gate_pass", topicSlug })}
              className="inline-flex min-h-ds-7 items-center rounded-ds-full bg-primary px-ds-5 text-sm font-semibold text-primary-foreground"
            >
              Contact Support
            </Link>
          ) : (
            <div className="rounded-ds-lg bg-surface-muted px-ds-4 py-ds-3 text-sm text-text-secondary">
              Complete the guided troubleshooting flow and select <strong>No</strong> before contacting Support.
              This helps us resolve your issue faster.
              <button
                type="button"
                className="mt-ds-2 block text-primary underline"
                onClick={() => {
                  resetHelpSession();
                  window.location.reload();
                }}
              >
                Restart guided troubleshooting
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

"use client";

import Link from "next/link";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { Card } from "@/components/ui/Card";
import { SUPPORT_SUCCESS_MESSAGE } from "@/lib/support/types";

type SupportSuccessPageProps = {
  ticketNumber?: string;
};

export function SupportSuccessPage({ ticketNumber }: SupportSuccessPageProps) {
  return (
    <BetaAppShell showBottomNav={false}>
      <HubPageMain withBottomNav={false} className="py-ds-8">
        <Card padding="lg" className="">
          <h1 className="text-xl font-semibold text-text-primary">{SUPPORT_SUCCESS_MESSAGE.title}</h1>
          {ticketNumber ? (
            <p className="mt-ds-2 text-sm text-text-secondary">Reference: {ticketNumber}</p>
          ) : null}
          <div className="mt-ds-4 space-y-ds-2 text-sm text-text-secondary">
            {SUPPORT_SUCCESS_MESSAGE.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <Link href="/help" className="mt-ds-5 inline-block text-sm font-medium text-primary underline">
            Back to Help Centre
          </Link>
        </Card>
      </HubPageMain>
    </BetaAppShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { AccountCanonicalHeader } from "@/features/account-canonical";

export const metadata: Metadata = {
  title: "About Us | ROVEXO",
  description: "ROVEXO is the UK marketplace to buy and sell with confidence.",
};

export default function AboutUsPage() {
  return (
    <BetaAppShell showBottomNav={false}>
      <AccountCanonicalHeader centeredTitle="About Us" fallbackHref="/help" />
      <main className="mx-auto w-full max-w-2xl px-3 py-4 text-[14px] leading-relaxed text-text-primary">
        <p className="m-0 text-[13px] text-text-secondary">BUY . SELL . GROW.</p>
        <h1 className="mt-2 text-[16px] font-semibold tracking-tight">About ROVEXO</h1>
        <p className="mt-3 text-text-secondary">
          ROVEXO is a UK marketplace built for people who want to buy and sell quickly,
          safely, and without clutter. One account. Compact tools. Clear policies.
        </p>
        <p className="mt-3 text-text-secondary">
          We provide the platform, checkout, wallet, messaging, and support infrastructure.
          Independent sellers remain responsible for their listings, pricing, and dispatch
          under ROVEXO policies and applicable UK law.
        </p>
        <ul className="mt-4 list-none space-y-2 p-0 text-[13px]">
          <li>
            <Link className="font-semibold text-primary" href="/help">
              Help Centre
            </Link>
          </li>
          <li>
            <Link className="font-semibold text-primary" href="/support">
              Contact Support
            </Link>
          </li>
          <li>
            <Link className="font-semibold text-primary" href="/legal">
              Legal Centre
            </Link>
          </li>
          <li>
            <Link className="font-semibold text-primary" href="/legal/community-guidelines">
              Community Guidelines
            </Link>
          </li>
        </ul>
      </main>
    </BetaAppShell>
  );
}

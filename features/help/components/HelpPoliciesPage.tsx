import Link from "next/link";
import { PageBack } from "@/components/navigation/PageBack";
import { Card } from "@/components/ui/Card";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";
import type { HelpPolicyEntry } from "@/lib/help/policies";

type HelpPoliciesPageProps = {
  policies: HelpPolicyEntry[];
};

export function HelpPoliciesPage({ policies }: HelpPoliciesPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-ds-6 px-ds-4 py-ds-6 pb-[calc(var(--ds-space-8)+env(safe-area-inset-bottom))]">
      <div>
        <PageBack variant="text" backHref="/help" backLabel="Help Centre" className="mb-ds-3" />
        <h1 className="mt-ds-3 text-2xl font-bold text-text-primary">Platform Policies</h1>
        <p className="mt-ds-2 text-sm text-text-secondary">
          Terms, privacy, safety, prohibited items, and community guidelines.
        </p>
      </div>

      <div className="mhub-mobile">
        <div className="mhub-grid">
          {policies.map((policy) => (
            <Link
              key={policy.slug}
              href={policy.href}
              className={cn("mhub-card", focusRing)}
              aria-label={`${policy.title}. ${policy.summary}`}
            >
              <p className="mhub-card__title">{policy.title}</p>
              <p className="mhub-card__subtitle">{policy.summary}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mhub-desktop">
        <div className="grid gap-ds-3">
          {policies.map((policy) => (
            <Link key={policy.slug} href={policy.href}>
              <Card padding="md" interactive className="">
                <p className="font-semibold text-text-primary">{policy.title}</p>
                <p className="mt-ds-1 text-sm text-text-secondary">{policy.summary}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

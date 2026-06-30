"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PremiumIcon } from "@/components/icons/PremiumIcon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { MotionDiv } from "@/components/ui/motion";
import { ASSISTANT_PERSONAS } from "@/lib/ai-assistant/personas";
import type { AssistantPersona, MarketplaceAssistantResponse } from "@/lib/ai-assistant/marketplace";
import { inferAssistantPersona } from "@/lib/ai-assistant/marketplace";
import { renderMarkdown } from "@/lib/help/markdown";
import { cn } from "@/lib/cn";
import { MobileHubNavigator } from "@/features/mobile-ui";

export function MarketplaceAssistantPage() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [persona, setPersona] = useState<AssistantPersona>(inferAssistantPersona(pathname));
  const [response, setResponse] = useState<MarketplaceAssistantResponse | null>(null);
  const [busy, setBusy] = useState(false);

  const ask = async () => {
    setBusy(true);
    try {
      const result = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, pathname, persona }),
      });
      if (!result.ok) return;
      const payload = (await result.json()) as { response: MarketplaceAssistantResponse };
      setResponse(payload.response);
    } finally {
      setBusy(false);
    }
  };

  const activePersona = ASSISTANT_PERSONAS.find((entry) => entry.id === persona);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-ds-6 px-ds-4 py-ds-6 pb-[calc(var(--ds-space-8)+env(safe-area-inset-bottom))]">
      <div className="mhub-mobile">
        <MobileHubNavigator defaultHub="support" startExpanded sectionTitle="Support hubs" />
      </div>
      <MotionDiv className="rx-surface-card flex items-start gap-ds-4 p-ds-5">
        <PremiumIcon size="lg" float glow label="ROVEXO AI">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
          </svg>
        </PremiumIcon>
        <div className="relative z-[1] min-w-0 flex-1">
          <p className="text-sm font-semibold text-primary">ROVEXO AI Assistant</p>
          <h1 className="mt-ds-1 text-2xl font-bold tracking-tight text-text-primary">How can I help?</h1>
          <p className="mt-ds-2 text-sm leading-relaxed text-text-secondary">
            Context-aware help for buyers, sellers, businesses, and trust — integrated with Help Center.
          </p>
        </div>
      </MotionDiv>

      <Card padding="lg">
        <p className="relative z-[1] text-sm font-semibold text-text-primary">Assistant mode</p>
        <div className="relative z-[1] mt-ds-3 flex flex-wrap gap-ds-2">
          {ASSISTANT_PERSONAS.map((entry) => (
            <CategoryChip
              key={entry.id}
              label={entry.label}
              active={persona === entry.id}
              onClick={() => setPersona(entry.id)}
            />
          ))}
        </div>
        {activePersona ? (
          <p className="relative z-[1] mt-ds-3 text-sm text-text-secondary">{activePersona.description}</p>
        ) : null}

        <div className="relative z-[1] mt-ds-4">
          <textarea
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            rows={3}
            placeholder="Ask about orders, withdrawals, verification, wholesale, navigation..."
            className="rx-glass rx-depth-1 w-full rounded-[var(--ds-radius-premium)] border-0 px-ds-4 py-ds-3 text-sm outline-none ring-2 ring-transparent focus:ring-primary/25"
          />
        </div>
        <Button className="relative z-[1] mt-ds-3" size="lg" disabled={!query.trim() || busy} onClick={() => void ask()}>
          {busy ? "Thinking…" : "Ask Assistant"}
        </Button>

        {response ? (
          <div className="relative z-[1] mt-ds-5 space-y-ds-4">
            {response.premiumRequired ? (
              <Badge variant="warning">Premium AI available on Enterprise plan — see /plans</Badge>
            ) : null}
            <div className="rx-glass rx-depth-1 rounded-[var(--ds-radius-premium)] px-ds-4 py-ds-4">
              <p className="mb-ds-2 text-xs font-semibold uppercase tracking-wide text-primary">Assistant</p>
              <div
                className="text-sm leading-relaxed text-text-secondary"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(response.answer) }}
              />
            </div>
            <div className="flex flex-wrap gap-ds-2">
              {response.guideHref ? (
                <Link href={response.guideHref}>
                  <CategoryChip
                    label={response.suggestTree ? "Start guided troubleshooting" : "Open guide"}
                    active
                  />
                </Link>
              ) : null}
              {response.navigationHref ? (
                <Link href={response.navigationHref}>
                  <CategoryChip label="Go to page" />
                </Link>
              ) : null}
              <Link href={response.trustHref ?? "/trust"}>
                <CategoryChip label="Trust Center" />
              </Link>
              <Link href={response.helpHref ?? "/help"}>
                <CategoryChip label="Help Center" />
              </Link>
            </div>
            <div className="space-y-ds-2">
              {response.suggestions.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={cn(
                    "rx-surface-card block px-ds-4 py-ds-3 text-sm font-medium text-primary",
                    "hover:-translate-y-px",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            {response.suggestSupport ? (
              <Link href="/support?guided=1" className="text-sm font-semibold text-primary hover:underline">
                Contact Support
              </Link>
            ) : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
}

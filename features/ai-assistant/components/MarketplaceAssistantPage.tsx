"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ASSISTANT_PERSONAS } from "@/lib/ai-assistant/personas";
import type { AssistantPersona, MarketplaceAssistantResponse } from "@/lib/ai-assistant/marketplace";
import { inferAssistantPersona } from "@/lib/ai-assistant/marketplace";
import { renderMarkdown } from "@/lib/help/markdown";

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
      <section>
        <p className="text-sm font-medium text-primary">ROVEXO AI Assistant</p>
        <h1 className="mt-ds-2 text-3xl font-bold text-text-primary">Marketplace Assistant</h1>
        <p className="mt-ds-2 text-sm text-text-secondary">
          Context-aware help for buyers, sellers, businesses, wholesale, and admins — integrated with Help Center and Trust Center.
        </p>
      </section>

      <Card padding="lg" className="shadow-ds-soft">
        <p className="text-sm font-semibold text-text-primary">Assistant mode</p>
        <div className="mt-ds-3 flex flex-wrap gap-ds-2">
          {ASSISTANT_PERSONAS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setPersona(entry.id)}
              className={`rounded-full px-ds-3 py-ds-1 text-sm ${
                persona === entry.id ? "bg-primary text-white" : "bg-surface-muted text-text-secondary"
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>
        {activePersona ? <p className="mt-ds-3 text-sm text-text-secondary">{activePersona.description}</p> : null}

        <textarea
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          rows={3}
          placeholder="Ask about orders, withdrawals, verification, wholesale, navigation..."
          className="mt-ds-4 w-full rounded-ds-lg border border-border bg-surface px-ds-3 py-ds-2 text-sm"
        />
        <Button className="mt-ds-3" disabled={!query.trim() || busy} onClick={() => void ask()}>
          Ask Assistant
        </Button>

        {response ? (
          <div className="mt-ds-5 space-y-ds-4">
            {response.premiumRequired ? (
              <Badge>Premium AI available on Enterprise plan — see /plans</Badge>
            ) : null}
            <div
              className="rounded-ds-md bg-surface-muted px-ds-3 py-ds-3 text-sm text-text-secondary"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(response.answer) }}
            />
            <div className="flex flex-wrap gap-ds-2">
              {response.guideHref ? (
                <Link href={response.guideHref} className="rounded-full bg-primary/10 px-ds-3 py-ds-1 text-sm font-medium text-primary">
                  {response.suggestTree ? "Start guided troubleshooting" : "Open guide"}
                </Link>
              ) : null}
              {response.navigationHref ? (
                <Link href={response.navigationHref} className="rounded-full bg-surface-muted px-ds-3 py-ds-1 text-sm text-text-primary">
                  Go to page
                </Link>
              ) : null}
              <Link href={response.trustHref ?? "/trust"} className="rounded-full bg-surface-muted px-ds-3 py-ds-1 text-sm text-text-primary">
                Trust Center
              </Link>
              <Link href={response.helpHref ?? "/help"} className="rounded-full bg-surface-muted px-ds-3 py-ds-1 text-sm text-text-primary">
                Help Center
              </Link>
            </div>
            <div className="space-y-ds-2">
              {response.suggestions.map((item) => (
                <Link key={item.href + item.label} href={item.href} className="block text-sm text-primary hover:underline">
                  {item.label}
                </Link>
              ))}
            </div>
            {response.suggestSupport ? (
              <Link href="/support?guided=1" className="text-sm font-medium text-primary hover:underline">
                Contact Support
              </Link>
            ) : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type DeveloperToolsPanelProps = {
  environment: {
    appUrl: boolean;
    supabase: boolean;
    stripe: boolean;
    redis: boolean;
  };
};

const TOOL_LINKS = [
  { href: "/super-admin/production-assets", label: "Production Validator", desc: "Validate premium assets before deploy" },
  { href: "/super-admin/monitoring", label: "Health Check", desc: "Infra diagnostics and cron status" },
  { href: "/super-admin/command", label: "Emergency Actions", desc: "High-impact ops with audit trail" },
  { href: "/super-admin/audit", label: "Audit Logs", desc: "Full platform action history" },
  { href: "/super-admin/platform", label: "Feature Flags", desc: "Maintenance mode and announcements" },
  { href: "/super-admin/operations", label: "AI Operations", desc: "Monitoring, repair, and scan tools" },
] as const;

export function DeveloperToolsPanel({ environment }: DeveloperToolsPanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runAction = useCallback((action: "validate" | "rebuild") => {
    startTransition(async () => {
      setMessage(null);
      setOutput(null);
      try {
        const response = await fetch("/api/super-admin/production-assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const data = (await response.json()) as { ok: boolean; message: string; output?: string };
        setMessage(data.message);
        setOutput(data.output ?? null);
      } catch {
        setMessage("Developer action failed.");
      }
    });
  }, []);

  const envItems = [
    { label: "App URL", ok: environment.appUrl },
    { label: "Supabase", ok: environment.supabase },
    { label: "Stripe", ok: environment.stripe },
    { label: "Redis", ok: environment.redis },
  ];

  return (
    <div className="mc-dev-tools">
      <section className="mc-section">
        <h2 className="mc-section__title">Quick actions</h2>
        <div className="mc-dev-tools__actions">
          <Button size="sm" disabled={isPending} onClick={() => runAction("validate")}>
            Production Validator
          </Button>
          <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("rebuild")}>
            Rebuild Assets
          </Button>
          <Link href="/super-admin/monitoring" className={cn("mc-dev-tools__link", focusRing)}>
            Health Check
          </Link>
        </div>
        {message ? <p className="mc-manager__message">{message}</p> : null}
        {output ? <pre className="mc-dev-tools__output">{output}</pre> : null}
      </section>

      <section className="mc-section">
        <h2 className="mc-section__title">Environment</h2>
        <div className="mc-service-grid mc-service-grid--compact">
          {envItems.map((item) => (
            <div key={item.label} className={cn("mc-service-card", item.ok ? "mc-service-card--online" : "mc-service-card--warning")}>
              <span className={cn("mc-service-card__dot", item.ok ? "mc-service-card__dot--online" : "mc-service-card__dot--warning")} aria-hidden />
              <div>
                <p className="mc-service-card__label">{item.label}</p>
                <p className="mc-service-card__status">{item.ok ? "CONFIGURED" : "MISSING"}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mc-section">
        <h2 className="mc-section__title">Developer modules</h2>
        <div className="mc-shortcut-grid mc-shortcut-grid--compact">
          {TOOL_LINKS.map((tool) => (
            <Link key={tool.href} href={tool.href} className={cn("mc-shortcut-card", focusRing)}>
              <span className="mc-shortcut-card__body">
                <span className="mc-shortcut-card__title">{tool.label}</span>
                <span className="mc-shortcut-card__desc">{tool.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

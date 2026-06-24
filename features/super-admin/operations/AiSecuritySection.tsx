"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { SecuritySnapshot } from "@/lib/super-admin/operations/types";
import { SEVERITY_BADGE } from "@/features/super-admin/operations/utils";

export function AiSecuritySection({ security }: { security: SecuritySnapshot }) {
  return (
    <section className="ai-ops-section">
      <h2 className="text-lg font-semibold text-text-primary">Security Center</h2>
      <p className="mt-ds-1 text-sm text-text-secondary">Authentication, API hardening, and threat signals.</p>

      <div className="mt-ds-4 grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card padding="md" className="premium-card">
          <p className="text-sm text-text-secondary">Rate Limiting</p>
          <p className="mt-ds-1 text-xl font-bold text-text-primary">
            {security.rateLimitingEnabled ? "Enabled" : "Disabled"}
          </p>
        </Card>
        <Card padding="md" className="premium-card">
          <p className="text-sm text-text-secondary">Failed Logins (24h)</p>
          <p className="mt-ds-1 text-xl font-bold text-text-primary">{security.failedLogins24h}</p>
        </Card>
        <Card padding="md" className="premium-card">
          <p className="text-sm text-text-secondary">Blocked Attacks (24h)</p>
          <p className="mt-ds-1 text-xl font-bold text-text-primary">{security.blockedAttacks24h}</p>
        </Card>
        <Card padding="md" className="premium-card">
          <p className="text-sm text-text-secondary">JWT Status</p>
          <div className="mt-ds-2">
            <Badge variant={SEVERITY_BADGE[security.jwtStatus]}>{security.jwtStatus}</Badge>
          </div>
        </Card>
        <Card padding="md" className="premium-card">
          <p className="text-sm text-text-secondary">API Security</p>
          <div className="mt-ds-2">
            <Badge variant={SEVERITY_BADGE[security.apiSecurityStatus]}>{security.apiSecurityStatus}</Badge>
          </div>
        </Card>
        <Card padding="md" className="premium-card">
          <p className="text-sm text-text-secondary">Suspicious IPs</p>
          <p className="mt-ds-1 text-sm text-text-primary">
            {security.suspiciousIps.length > 0 ? security.suspiciousIps.join(", ") : "None detected"}
          </p>
        </Card>
      </div>

      <Card padding="md" className="premium-glass mt-ds-4 border border-border/80">
        <p className="text-sm font-semibold text-text-primary">Security Headers</p>
        <div className="mt-ds-2 flex flex-wrap gap-ds-2">
          {security.securityHeaders.map((header) => (
            <Badge key={header} variant="success">
              {header}
            </Badge>
          ))}
        </div>
      </Card>
    </section>
  );
}

"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useOwnerDemoMode } from "@/features/inbox/hooks/use-owner-demo-mode";
import { OWNER_DEMO_MODE_V1 } from "@/lib/inbox/demo/owner-demo-mode-v1";

export function OwnerDemoModePanel() {
  const { enabled, setEnabled, hydrated } = useOwnerDemoMode();

  return (
    <div className="space-y-ds-4" data-owner-demo-mode={OWNER_DEMO_MODE_V1.version}>
      <Card className="space-y-ds-3 p-ds-4">
        <h2 className="text-lg font-semibold">Owner Demo Mode</h2>
        <p className="text-sm text-[var(--cds-color-text-secondary)]">
          Default OFF. When ON, Super Admin Inbox may show Messages lifecycle demo fixtures.
          Normal users never see demo conversations.
        </p>
        <p className="text-sm font-medium">
          Status: {!hydrated ? "…" : enabled ? "ON" : "OFF"}
        </p>
        <div className="flex flex-wrap gap-ds-2">
          <Button
            type="button"
            variant={enabled ? "primary" : "secondary"}
            disabled={!hydrated || enabled}
            onClick={() => setEnabled(true)}
          >
            Enable Owner Demo Mode
          </Button>
          <Button
            type="button"
            variant={!enabled ? "primary" : "secondary"}
            disabled={!hydrated || !enabled}
            onClick={() => setEnabled(false)}
          >
            Disable Owner Demo Mode
          </Button>
        </div>
      </Card>
    </div>
  );
}

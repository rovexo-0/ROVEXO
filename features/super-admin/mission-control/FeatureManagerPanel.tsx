"use client";

import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { MissionControlFeatureToggle } from "@/lib/super-admin/mission-control/types";

type FeatureManagerPanelProps = {
  initialFeatures: MissionControlFeatureToggle[];
};

const STATE_OPTIONS = ["live", "beta", "coming-soon", "maintenance"] as const;

export function FeatureManagerPanel({ initialFeatures }: FeatureManagerPanelProps) {
  const [features, setFeatures] = useState(initialFeatures);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateFeature = useCallback((id: string, patch: Partial<MissionControlFeatureToggle>) => {
    setFeatures((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const save = useCallback(() => {
    startTransition(async () => {
      setMessage(null);
      const response = await fetch("/api/super-admin/mission-control", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "features", value: features }),
      });
      setMessage(response.ok ? "Feature flags published." : "Unable to save feature settings.");
    });
  }, [features]);

  return (
    <div className="mc-manager">
      <div className="mc-manager__toolbar">
        <p className="mc-manager__hint">Enable, disable, or roll out modules across the marketplace.</p>
        <Button size="sm" disabled={isPending} onClick={save}>
          Publish
        </Button>
      </div>
      {message ? <p className="mc-manager__message">{message}</p> : null}
      <div className="mc-manager__grid">
        {features.map((feature) => (
          <div key={feature.id} className="mc-manager__card">
            <div className="mc-manager__card-head">
              <div>
                <h3 className="mc-manager__card-title">{feature.label}</h3>
                <p className="mc-manager__card-desc">{feature.description}</p>
              </div>
              <label className="mc-builder__toggle">
                <input
                  type="checkbox"
                  checked={feature.enabled}
                  onChange={(event) => updateFeature(feature.id, { enabled: event.target.checked })}
                />
                {feature.enabled ? "Enabled" : "Disabled"}
              </label>
            </div>
            <div className="mc-manager__card-meta">
              <label className="mc-manager__field">
                <span>State</span>
                <select
                  value={feature.state}
                  onChange={(event) =>
                    updateFeature(feature.id, { state: event.target.value as MissionControlFeatureToggle["state"] })
                  }
                  className="mc-manager__select"
                >
                  {STATE_OPTIONS.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mc-manager__field">
                <span>Version</span>
                <input
                  type="text"
                  value={feature.version}
                  onChange={(event) => updateFeature(feature.id, { version: event.target.value })}
                  className="mc-manager__input"
                />
              </label>
              <span className={cn("mc-manager__state-pill", `mc-manager__state-pill--${feature.state}`)}>
                {feature.state}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import type { MissionControlAiToggle } from "@/lib/super-admin/mission-control/types";

type AiManagerPanelProps = {
  initialGlobalEnabled: boolean;
  initialFeatures: MissionControlAiToggle[];
};

export function AiManagerPanel({ initialGlobalEnabled, initialFeatures }: AiManagerPanelProps) {
  const [globalEnabled, setGlobalEnabled] = useState(initialGlobalEnabled);
  const [features, setFeatures] = useState(initialFeatures);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateFeature = useCallback((id: string, patch: Partial<MissionControlAiToggle>) => {
    setFeatures((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const save = useCallback(() => {
    startTransition(async () => {
      setMessage(null);
      const response = await fetch("/api/super-admin/mission-control", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "ai",
          value: { globalEnabled, features },
        }),
      });
      setMessage(response.ok ? "AI configuration published." : "Unable to save AI settings.");
    });
  }, [features, globalEnabled]);

  return (
    <div className="mc-manager">
      <div className="mc-manager__toolbar">
        <div>
          <p className="mc-manager__hint">
            Local execution is preferred. Server AI is used only when local execution is not technically possible.
          </p>
          <label className="mc-builder__toggle mc-builder__toggle--global">
            <input type="checkbox" checked={globalEnabled} onChange={(event) => setGlobalEnabled(event.target.checked)} />
            Global AI {globalEnabled ? "ON" : "OFF"}
          </label>
        </div>
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
                  disabled={!globalEnabled}
                  onChange={(event) => updateFeature(feature.id, { enabled: event.target.checked })}
                />
                {feature.enabled ? "ON" : "OFF"}
              </label>
            </div>
            <div className="mc-manager__card-meta">
              <label className="mc-manager__field">
                <span>Execution</span>
                <select
                  value={feature.execution}
                  disabled={!globalEnabled}
                  onChange={(event) =>
                    updateFeature(feature.id, {
                      execution: event.target.value as MissionControlAiToggle["execution"],
                    })
                  }
                  className="mc-manager__select"
                >
                  <option value="local">Local device</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="server">Server</option>
                </select>
              </label>
              <span className="mc-manager__exec-pill">{feature.execution}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

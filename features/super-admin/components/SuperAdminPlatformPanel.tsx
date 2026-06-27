"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type SettingsPayload = {
  maintenance_mode?: { enabled: boolean; message: string };
  feature_visibility?: { auctions: boolean; wholesale: boolean; voiceSearch: boolean };
  platform_announcement?: { enabled: boolean; title: string; body: string; href: string };
};

export function SuperAdminPlatformPanel() {
  const [settings, setSettings] = useState<SettingsPayload>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/super-admin/settings")
      .then((response) => response.json())
      .then((payload: { settings?: Record<string, SettingsPayload[keyof SettingsPayload]> }) => {
        const raw = payload.settings ?? {};
        setSettings({
          maintenance_mode: (raw.maintenance_mode as SettingsPayload["maintenance_mode"]) ?? undefined,
          feature_visibility: (raw.feature_visibility as SettingsPayload["feature_visibility"]) ?? undefined,
          platform_announcement:
            (raw.platform_announcement as SettingsPayload["platform_announcement"]) ?? undefined,
        });
      });
  }, []);

  async function save(key: keyof SettingsPayload, value: Record<string, unknown>) {
    setMessage(null);
    const response = await fetch("/api/super-admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    setMessage(response.ok ? "Settings saved." : "Unable to save settings.");
  }

  const maintenance = settings.maintenance_mode ?? { enabled: false, message: "" };
  const features = settings.feature_visibility ?? { auctions: false, wholesale: true, voiceSearch: false };
  const announcement = settings.platform_announcement ?? { enabled: false, title: "", body: "", href: "" };

  return (
    <div className="space-y-ds-4">
      <Card padding="md" className="bg-white">
        <h3 className="font-semibold">Maintenance mode</h3>
        <label className="mt-ds-3 flex items-center gap-ds-2 text-sm">
          <input
            type="checkbox"
            checked={maintenance.enabled}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                maintenance_mode: { ...maintenance, enabled: event.target.checked },
              }))
            }
          />
          Enable maintenance mode
        </label>
        <textarea
          value={maintenance.message}
          onChange={(event) =>
            setSettings((current) => ({
              ...current,
              maintenance_mode: { ...maintenance, message: event.target.value },
            }))
          }
          rows={3}
          className="rx-input mt-ds-3 w-full rounded-ds-md px-ds-3 py-ds-2 text-sm"
        />
        <Button className="mt-ds-3" onClick={() => void save("maintenance_mode", maintenance)}>
          Save maintenance
        </Button>
      </Card>

      <Card padding="md" className="bg-white">
        <h3 className="font-semibold">Feature visibility</h3>
        <div className="mt-ds-3 space-y-ds-2 text-sm">
          {(["auctions", "wholesale", "voiceSearch"] as const).map((key) => (
            <label key={key} className="flex items-center gap-ds-2">
              <input
                type="checkbox"
                checked={features[key]}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    feature_visibility: { ...features, [key]: event.target.checked },
                  }))
                }
              />
              {key}
            </label>
          ))}
        </div>
        <Button className="mt-ds-3" onClick={() => void save("feature_visibility", features)}>
          Save features
        </Button>
      </Card>

      <Card padding="md" className="bg-white">
        <h3 className="font-semibold">Platform announcement</h3>
        <div className="mt-ds-3 grid gap-ds-3">
          <label className="flex items-center gap-ds-2 text-sm">
            <input
              type="checkbox"
              checked={announcement.enabled}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  platform_announcement: { ...announcement, enabled: event.target.checked },
                }))
              }
            />
            Show announcement
          </label>
          <input
            value={announcement.title}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                platform_announcement: { ...announcement, title: event.target.value },
              }))
            }
            placeholder="Title"
            className="rx-input min-h-ds-7 rounded-ds-md px-ds-3 text-sm"
          />
          <textarea
            value={announcement.body}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                platform_announcement: { ...announcement, body: event.target.value },
              }))
            }
            placeholder="Body"
            rows={3}
            className="rx-input rounded-ds-md px-ds-3 py-ds-2 text-sm"
          />
        </div>
        <Button className="mt-ds-3" onClick={() => void save("platform_announcement", announcement)}>
          Save announcement
        </Button>
      </Card>

      {message ? <p className="text-sm font-medium text-primary">{message}</p> : null}
    </div>
  );
}

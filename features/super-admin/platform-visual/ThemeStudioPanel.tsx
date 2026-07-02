"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ResponsivePreviewFrame } from "@/features/super-admin/mission-control/ResponsivePreviewFrame";
import type { PlatformVisualBundle, PlatformVisualHistoryEntry } from "@/lib/platform-visual/types";

type ThemeStudioPanelProps = {
  initialDraft: PlatformVisualBundle;
  initialHistory: PlatformVisualHistoryEntry[];
};

export function ThemeStudioPanel({ initialDraft, initialHistory }: ThemeStudioPanelProps) {
  const [draft, setDraft] = useState(initialDraft);
  const [history, setHistory] = useState(initialHistory);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runAction = useCallback(
    (action: "save-draft" | "publish" | "duplicate" | "reset-draft" | "export", historyId?: string) => {
      startTransition(async () => {
        setMessage(null);
        const response = await fetch("/api/super-admin/platform-visual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, bundle: draft, historyId }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          draft?: PlatformVisualBundle;
          history?: PlatformVisualHistoryEntry[];
          error?: string;
          bundle?: PlatformVisualBundle;
        };

        if (!response.ok) {
          setMessage(data.error ?? "Theme action failed.");
          return;
        }

        if (data.draft) setDraft(data.draft);
        if (data.history) setHistory(data.history);
        if (action === "export" && data.bundle) {
          const blob = new Blob([JSON.stringify(data.bundle, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = `rovexo-theme-${Date.now()}.json`;
          anchor.click();
          URL.revokeObjectURL(url);
        }
        setMessage(
          action === "publish"
            ? "Theme published to the live marketplace."
            : action === "save-draft"
              ? "Draft saved."
              : action === "reset-draft"
                ? "Draft reset from live theme."
                : action === "duplicate"
                  ? "Theme duplicated into draft."
                  : "Theme exported.",
        );
      });
    },
    [draft],
  );

  const rollback = useCallback(
    (historyId: string) => {
      startTransition(async () => {
        setMessage(null);
        const response = await fetch("/api/super-admin/platform-visual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "rollback", historyId }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          error?: string;
          draft?: PlatformVisualBundle;
          history?: PlatformVisualHistoryEntry[];
        };
        if (data.draft) setDraft(data.draft);
        if (data.history) setHistory(data.history);
        setMessage(response.ok ? "Theme rolled back." : data.error ?? "Rollback failed.");
      });
    },
    [],
  );

  const updateThemeToken = useCallback((key: keyof PlatformVisualBundle["theme"], value: string | number) => {
    setDraft((current) => ({
      ...current,
      theme: { ...current.theme, [key]: value },
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  return (
    <div className="mc-theme-studio">
      <div className="mc-manager__toolbar">
        <div>
          <p className="mc-manager__hint">
            Draft changes preview at{" "}
            <Link href="/?visualPreview=draft" className="mc-section__link" target="_blank">
              /?visualPreview=draft
            </Link>
            . Only one theme is live at a time.
          </p>
        </div>
        <div className="mc-dev-tools__actions">
          <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("reset-draft")}>
            Reset Draft
          </Button>
          <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("duplicate")}>
            Duplicate
          </Button>
          <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("export")}>
            Export
          </Button>
          <Button size="sm" disabled={isPending} onClick={() => runAction("save-draft")}>
            Save Draft
          </Button>
          <Button size="sm" disabled={isPending} onClick={() => runAction("publish")}>
            Publish Live
          </Button>
        </div>
      </div>
      {message ? <p className="mc-manager__message">{message}</p> : null}

      <div className="mc-theme-studio__grid">
        <section className="mc-section rx-surface-card rounded-ds-xl p-ds-5">
          <h2 className="mc-section__title">Theme tokens</h2>
          <div className="mc-theme-studio__tokens">
            <label className="mc-manager__field">
              <span>Primary</span>
              <input
                className="mc-manager__input"
                value={draft.theme.primary ?? ""}
                onChange={(event) => updateThemeToken("primary", event.target.value)}
              />
            </label>
            <label className="mc-manager__field">
              <span>Background</span>
              <input
                className="mc-manager__input"
                value={draft.theme.background ?? ""}
                onChange={(event) => updateThemeToken("background", event.target.value)}
              />
            </label>
            <label className="mc-manager__field">
              <span>Radius</span>
              <input
                type="range"
                min={8}
                max={32}
                value={draft.theme.radius ?? 16}
                onChange={(event) => updateThemeToken("radius", Number(event.target.value))}
              />
            </label>
            <label className="mc-manager__field">
              <span>Font scale</span>
              <input
                type="range"
                min={0.9}
                max={1.2}
                step={0.05}
                value={draft.theme.fontScale ?? 1}
                onChange={(event) => updateThemeToken("fontScale", Number(event.target.value))}
              />
            </label>
          </div>
        </section>

        <section className="mc-section">
          <ResponsivePreviewFrame src="/?visualPreview=draft" title="Live theme preview" />
        </section>
      </div>

      <section className="mc-section rx-surface-card rounded-ds-xl p-ds-5">
        <h2 className="mc-section__title">Theme history</h2>
        <div className="mc-theme-studio__history">
          {history.length === 0 ? <p className="mc-section__desc">No published theme history yet.</p> : null}
          {history.map((entry) => (
            <div key={entry.id} className="mc-theme-studio__history-row">
              <div>
                <p className="font-semibold">{entry.label}</p>
                <p className="text-sm text-text-secondary">
                  {new Date(entry.publishedAt).toLocaleString()} · rollback {entry.rollbackAvailable ? "available" : "unavailable"}
                </p>
              </div>
              {entry.rollbackAvailable ? (
                <Button size="sm" variant="secondary" disabled={isPending} onClick={() => rollback(entry.id)}>
                  Rollback
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

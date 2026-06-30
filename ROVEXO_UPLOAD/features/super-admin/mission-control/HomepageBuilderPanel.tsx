"use client";

import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { ResponsivePreviewFrame } from "@/features/super-admin/mission-control/ResponsivePreviewFrame";
import type {
  HomepageBuilderComponent,
  HomepageBuilderConfig,
  HomepageComponentStyle,
} from "@/lib/super-admin/mission-control/types";
import { cn } from "@/lib/cn";

type HomepageBuilderPanelProps = {
  initialConfig: HomepageBuilderConfig;
};

export function HomepageBuilderPanel({ initialConfig }: HomepageBuilderPanelProps) {
  const [config, setConfig] = useState(initialConfig);
  const [selectedId, setSelectedId] = useState<string | null>(config.components[0]?.id ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selected = config.components.find((item) => item.id === selectedId) ?? null;

  const updateComponent = useCallback((id: string, patch: Partial<HomepageBuilderComponent>) => {
    setConfig((current) => ({
      ...current,
      components: current.components.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateStyle = useCallback((id: string, patch: Partial<HomepageComponentStyle>) => {
    setConfig((current) => ({
      ...current,
      components: current.components.map((item) =>
        item.id === id ? { ...item, style: { ...item.style, ...patch } } : item,
      ),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const save = useCallback(() => {
    startTransition(async () => {
      setMessage(null);
      const response = await fetch("/api/super-admin/mission-control", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "homepage-builder", value: config }),
      });
      setMessage(response.ok ? "Homepage configuration published to Mission Control." : "Unable to save homepage builder.");
    });
  }, [config]);

  return (
    <div className="mc-builder">
      <div className="mc-builder__sidebar">
        <div className="mc-builder__header">
          <h2 className="mc-builder__title">Homepage components</h2>
          <Button size="sm" disabled={isPending} onClick={save}>
            Publish
          </Button>
        </div>
        {message ? <p className="mc-builder__message">{message}</p> : null}
        <ul className="mc-builder__list">
          {[...config.components]
            .sort((a, b) => a.order - b.order)
            .map((component) => (
              <li key={component.id}>
                <button
                  type="button"
                  className={cn("mc-builder__item", selectedId === component.id && "mc-builder__item--active")}
                  onClick={() => setSelectedId(component.id)}
                >
                  <span>{component.label}</span>
                  <span className={cn("mc-builder__pill", component.published ? "mc-builder__pill--live" : "mc-builder__pill--draft")}>
                    {component.published ? "Published" : "Draft"}
                  </span>
                </button>
              </li>
            ))}
        </ul>
      </div>

      <div className="mc-builder__main">
        {selected ? (
          <div className="mc-builder__editor">
            <h3 className="text-lg font-semibold">{selected.label}</h3>
            <div className="mc-builder__actions">
              <label className="mc-builder__toggle">
                <input
                  type="checkbox"
                  checked={selected.enabled}
                  onChange={(event) => updateComponent(selected.id, { enabled: event.target.checked })}
                />
                Enabled
              </label>
              <label className="mc-builder__toggle">
                <input
                  type="checkbox"
                  checked={selected.published}
                  onChange={(event) => updateComponent(selected.id, { published: event.target.checked })}
                />
                Published
              </label>
            </div>
            <div className="mc-builder__visibility">
              {(["desktop", "tablet", "mobile"] as const).map((viewport) => (
                <label key={viewport} className="mc-builder__toggle">
                  <input
                    type="checkbox"
                    checked={selected.visibility[viewport]}
                    onChange={(event) =>
                      updateComponent(selected.id, {
                        visibility: { ...selected.visibility, [viewport]: event.target.checked },
                      })
                    }
                  />
                  {viewport}
                </label>
              ))}
            </div>
            <div className="mc-pixel-editor">
              <h4 className="mc-pixel-editor__title">Pixel editor</h4>
              {(
                [
                  ["padding", "Padding", 0, 64],
                  ["margin", "Margin", 0, 64],
                  ["gap", "Gap", 0, 48],
                  ["borderRadius", "Border radius", 0, 48],
                  ["height", "Height", 32, 640],
                  ["columns", "Columns", 1, 6],
                  ["iconSize", "Icon size", 24, 128],
                  ["opacity", "Opacity", 0.4, 1],
                ] as const
              ).map(([key, label, min, max]) => (
                <label key={key} className="mc-pixel-editor__field">
                  <span>{label}</span>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={key === "opacity" ? 0.05 : 1}
                    value={Number(selected.style[key] ?? (key === "opacity" ? 1 : min))}
                    onChange={(event) => updateStyle(selected.id, { [key]: Number(event.target.value) })}
                  />
                  <span className="mc-pixel-editor__value">{selected.style[key] ?? "—"}</span>
                </label>
              ))}
            </div>
          </div>
        ) : null}
        <ResponsivePreviewFrame src="/" title="Homepage preview" />
      </div>
    </div>
  );
}

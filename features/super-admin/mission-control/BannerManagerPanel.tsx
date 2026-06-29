"use client";

import Image from "next/image";
import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { ResponsivePreviewFrame } from "@/features/super-admin/mission-control/ResponsivePreviewFrame";
import { cn } from "@/lib/cn";
import type { BannerManagerConfig, BannerManagerItem } from "@/lib/super-admin/mission-control/types";

type BannerManagerPanelProps = {
  initialConfig: BannerManagerConfig;
};

export function BannerManagerPanel({ initialConfig }: BannerManagerPanelProps) {
  const [config, setConfig] = useState(initialConfig);
  const [selectedId, setSelectedId] = useState<string | null>(config.banners[0]?.id ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selected = config.banners.find((item) => item.id === selectedId) ?? null;

  const updateBanner = useCallback((id: string, patch: Partial<BannerManagerItem>) => {
    setConfig((current) => ({
      ...current,
      banners: current.banners.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const save = useCallback(() => {
    startTransition(async () => {
      setMessage(null);
      const response = await fetch("/api/super-admin/mission-control", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "banners", value: config }),
      });
      setMessage(response.ok ? "Banner configuration published." : "Unable to save banners.");
    });
  }, [config]);

  return (
    <div className="mc-builder">
      <div className="mc-builder__sidebar">
        <div className="mc-builder__header">
          <h2 className="mc-builder__title">Hero banners</h2>
          <Button size="sm" disabled={isPending} onClick={save}>
            Publish
          </Button>
        </div>
        {message ? <p className="mc-builder__message">{message}</p> : null}
        <ul className="mc-builder__list">
          {[...config.banners]
            .sort((a, b) => a.order - b.order)
            .map((banner) => (
              <li key={banner.id}>
                <button
                  type="button"
                  className={cn("mc-builder__item", selectedId === banner.id && "mc-builder__item--active")}
                  onClick={() => setSelectedId(banner.id)}
                >
                  <span>{banner.title}</span>
                  <span className={cn("mc-builder__pill", banner.published ? "mc-builder__pill--live" : "mc-builder__pill--draft")}>
                    {banner.published ? "Live" : "Draft"}
                  </span>
                </button>
              </li>
            ))}
        </ul>
      </div>

      <div className="mc-builder__main">
        {selected ? (
          <div className="mc-builder__editor">
            <h3 className="text-lg font-semibold">{selected.title}</h3>
            {selected.image ? (
              <div className="mc-banner-preview">
                <Image src={selected.image} alt="" width={640} height={360} className="mc-banner-preview__image" />
              </div>
            ) : null}
            <div className="mc-builder__actions">
              <label className="mc-builder__toggle">
                <input
                  type="checkbox"
                  checked={selected.published}
                  onChange={(event) => updateBanner(selected.id, { published: event.target.checked })}
                />
                Published
              </label>
              <label className="mc-builder__toggle">
                <input
                  type="checkbox"
                  checked={selected.enabled}
                  onChange={(event) => updateBanner(selected.id, { enabled: event.target.checked })}
                />
                Enabled
              </label>
            </div>
            <label className="mc-manager__field">
              <span>CTA label</span>
              <input
                type="text"
                value={selected.cta}
                onChange={(event) => updateBanner(selected.id, { cta: event.target.value })}
                className="mc-manager__input"
              />
            </label>
            <label className="mc-manager__field">
              <span>Destination URL</span>
              <input
                type="text"
                value={selected.href}
                onChange={(event) => updateBanner(selected.id, { href: event.target.value })}
                className="mc-manager__input"
              />
            </label>
            <label className="mc-manager__field">
              <span>Slider order</span>
              <input
                type="number"
                min={0}
                max={20}
                value={selected.order}
                onChange={(event) => updateBanner(selected.id, { order: Number(event.target.value) })}
                className="mc-manager__input"
              />
            </label>
            <label className="mc-manager__field">
              <span>Transition duration (ms)</span>
              <input
                type="range"
                min={200}
                max={2000}
                step={50}
                value={selected.transitionMs}
                onChange={(event) => updateBanner(selected.id, { transitionMs: Number(event.target.value) })}
              />
              <span className="mc-pixel-editor__value">{selected.transitionMs}ms</span>
            </label>
          </div>
        ) : null}
        <ResponsivePreviewFrame src="/" title="Banner responsive preview" />
      </div>
    </div>
  );
}

"use client";

import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import type { MenuBuilderConfig, MenuItemConfig } from "@/lib/platform-visual/types";

type MenuBuilderPanelProps = {
  initialMenus: MenuBuilderConfig;
};

const MENU_SECTIONS: { key: keyof MenuBuilderConfig; label: string }[] = [
  { key: "bottomNav", label: "Bottom Menu" },
  { key: "topNav", label: "Top Menu" },
  { key: "mobileNav", label: "Mobile Menu" },
  { key: "desktopNav", label: "Desktop Menu" },
  { key: "footerNav", label: "Footer Menu" },
  { key: "accountNav", label: "Account Menu" },
];

export function MenuBuilderPanel({ initialMenus }: MenuBuilderPanelProps) {
  const [menus, setMenus] = useState(initialMenus);
  const [activeSection, setActiveSection] = useState<keyof MenuBuilderConfig>("bottomNav");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const items = Array.isArray(menus[activeSection]) ? (menus[activeSection] as MenuItemConfig[]) : [];

  const updateItem = useCallback(
    (id: string, patch: Partial<MenuItemConfig>) => {
      setMenus((current) => ({
        ...current,
        [activeSection]: (current[activeSection] as MenuItemConfig[]).map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        ),
        updatedAt: new Date().toISOString(),
      }));
    },
    [activeSection],
  );

  const save = useCallback(() => {
    startTransition(async () => {
      setMessage(null);
      const response = await fetch("/api/super-admin/menu-builder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menus }),
      });
      setMessage(response.ok ? "Menus published to the live platform." : "Unable to save menus.");
    });
  }, [menus]);

  return (
    <div className="mc-menu-builder">
      <div className="mc-manager__toolbar">
        <p className="mc-manager__hint">Drag-and-drop ready menu registry. Bottom menu drives live navigation immediately after publish.</p>
        <Button size="sm" disabled={isPending} onClick={save}>
          Publish
        </Button>
      </div>
      {message ? <p className="mc-manager__message">{message}</p> : null}

      <div className="mc-menu-builder__tabs">
        {MENU_SECTIONS.map((section) => (
          <button
            key={section.key}
            type="button"
            className={activeSection === section.key ? "mc-preview__device mc-preview__device--active" : "mc-preview__device"}
            onClick={() => setActiveSection(section.key)}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="mc-manager__grid">
        {items.map((item) => (
          <div key={item.id} className="mc-manager__card">
            <div className="mc-manager__card-head">
              <div>
                <h3 className="mc-manager__card-title">{item.label}</h3>
                <p className="mc-manager__card-desc">{item.href}</p>
              </div>
              <label className="mc-builder__toggle">
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={(event) => updateItem(item.id, { enabled: event.target.checked })}
                />
                Enabled
              </label>
            </div>
            <div className="mc-manager__card-meta">
              <label className="mc-manager__field">
                <span>Label</span>
                <input
                  className="mc-manager__input"
                  value={item.label}
                  onChange={(event) => updateItem(item.id, { label: event.target.value })}
                />
              </label>
              <label className="mc-manager__field">
                <span>URL</span>
                <input
                  className="mc-manager__input"
                  value={item.href}
                  onChange={(event) => updateItem(item.id, { href: event.target.value })}
                />
              </label>
              <label className="mc-manager__field">
                <span>Order</span>
                <input
                  type="number"
                  className="mc-manager__input"
                  value={item.order}
                  onChange={(event) => updateItem(item.id, { order: Number(event.target.value) })}
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

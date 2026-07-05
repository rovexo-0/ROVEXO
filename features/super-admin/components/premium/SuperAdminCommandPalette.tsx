"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/features/search/hooks/use-debounced-value";
import { buildEnterprisePrimaryNavItems } from "@/lib/enterprise-architecture/navigation";
import { cn } from "@/lib/cn";
import { SUPER_ADMIN_QUICK_LINKS } from "@/lib/super-admin/nav";

type CommandItem = {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon?: string;
};

type SuperAdminCommandPaletteProps = {
  open: boolean;
  onClose: () => void;
};

export function SuperAdminCommandPalette({ open, onClose }: SuperAdminCommandPaletteProps) {
  if (!open) return null;
  return <SuperAdminCommandPalettePanel onClose={onClose} />;
}

function SuperAdminCommandPalettePanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const debouncedQuery = useDebouncedValue(query, 150);

  const staticItems = useMemo<CommandItem[]>(() => {
    const enterprise = buildEnterprisePrimaryNavItems().map((item) => ({
      id: item.href,
      label: item.label,
      description: item.description,
      href: item.href,
      icon: item.icon,
    }));
    const quick = SUPER_ADMIN_QUICK_LINKS.map((item) => ({
      id: item.href,
      label: item.label,
      description: item.description,
      href: item.href,
      icon: item.icon,
    }));
    const seen = new Set<string>();
    return [...enterprise, ...quick].filter((item) => {
      if (seen.has(item.href)) return false;
      seen.add(item.href);
      return true;
    });
  }, []);

  const filtered = useMemo(() => {
    const trimmed = debouncedQuery.trim().toLowerCase();
    if (!trimmed) return staticItems.slice(0, 24);
    return staticItems.filter(
      (item) =>
        item.label.toLowerCase().includes(trimmed) ||
        item.description?.toLowerCase().includes(trimmed) ||
        item.href.toLowerCase().includes(trimmed),
    );
  }, [debouncedQuery, staticItems]);

  const safeActiveIndex = filtered.length === 0 ? 0 : Math.min(activeIndex, filtered.length - 1);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
      }
      if (event.key === "Enter" && filtered[safeActiveIndex]) {
        event.preventDefault();
        window.location.href = filtered[safeActiveIndex]!.href;
        onClose();
      }
    },
    [filtered, onClose, safeActiveIndex],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  return (
    <div className="sa-premium-palette" role="dialog" aria-modal="true" aria-label="Command palette" onClick={onClose}>
      <div className="sa-premium-palette__panel" onClick={(event) => event.stopPropagation()}>
        <input
          className="sa-premium-palette__input"
          placeholder="Search modules, pages, and commands…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          autoFocus
          aria-label="Command palette search"
        />
        <div className="sa-premium-palette__results" role="listbox">
          {filtered.length === 0 ? (
            <p className="px-ds-3 py-ds-4 text-sm text-text-secondary">No matches found.</p>
          ) : (
            filtered.map((item, index) => (
              <Link
                key={item.id}
                href={item.href}
                className={cn("sa-premium-palette__item", index === safeActiveIndex && "sa-premium-palette__item--active")}
                onClick={onClose}
                role="option"
                aria-selected={index === safeActiveIndex}
              >
                <span className="sa-premium-palette__item-icon" aria-hidden>{item.icon ?? "📄"}</span>
                <span>
                  <span className="sa-premium-palette__item-label">{item.label}</span>
                  {item.description ? (
                    <span className="sa-premium-palette__item-desc">{item.description}</span>
                  ) : null}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function useSuperAdminCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { open, setOpen, close: () => setOpen(false) };
}

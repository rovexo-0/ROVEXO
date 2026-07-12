"use client";

import { CanonicalCard, CanonicalMenuRow } from "@/src/components/canonical";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";

import { cn } from "@/lib/cn";
import "@/features/account-module/components/settings-accordion.css";

const STORAGE_KEY = "rovexo.settings.accordion";

function readStoredSection(validIds: string[]): string | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved && validIds.includes(saved)) return saved;
  } catch {
    /* sessionStorage unavailable */
  }
  return null;
}

export type SettingsAccordionRow = {
  label: string;
  href: string;
  icon?: ReactNode;
  value?: string;
};

export type SettingsAccordionGroup = {
  id: string;
  title: string;
  icon?: ReactNode;
  rows: SettingsAccordionRow[];
};

type SettingsAccordionProps = {
  groups: SettingsAccordionGroup[];
};

export function SettingsAccordion({ groups }: SettingsAccordionProps) {
  const validIds = groups.map((group) => group.id);
  const [openId, setOpenId] = useState<string | null>(() => readStoredSection(validIds));

  const toggle = useCallback((id: string) => {
    setOpenId((current) => {
      const next = current === id ? null : id;
      try {
        if (next) sessionStorage.setItem(STORAGE_KEY, next);
        else sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* sessionStorage unavailable */
      }
      return next;
    });
  }, []);

  return (
    <CanonicalCard variant="list" className="cds-accordion" data-settings-accordion="v1.0">
      {groups.map((group) => {
        const expanded = openId === group.id;
        return (
          <div
            key={group.id}
            className={cn("cds-accordion__section", expanded && "cds-accordion__section--open")}
          >
            <CanonicalMenuRow
              title={group.title}
              icon={group.icon}
              onClick={() => toggle(group.id)}
              className="cds-accordion__trigger"
              id={`settings-accordion-${group.id}`}
            />
            <div
              className={cn("cds-accordion__panel", expanded && "cds-accordion__panel--open")}
              aria-hidden={!expanded}
            >
              <div className="cds-accordion__panel-inner">
                {group.rows.map((row) => (
                  <CanonicalMenuRow
                    key={row.label}
                    title={row.label}
                    href={row.href}
                    icon={row.icon}
                    value={row.value}
                    className="cds-menu-row--nested"
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </CanonicalCard>
  );
}

"use client";

import { cn } from "@/lib/cn";
import { useTranslation } from "@/lib/i18n/use-translation";
import { CanonicalSwitch } from "@/src/components/canonical";
import { ProfileMenuIcon } from "@/features/account-center/components/ProfileMenuIcons";
import { useRovexoTheme } from "@/components/providers/RovexoThemeProvider";

/**
 * Profile → Theme inline switch (v1.0).
 * Placed directly under Rovexo Ideas · before Sign Out.
 * Same control on iPhone / Android / Desktop — one document theme state.
 * OFF = existing white/light · ON = Black Underground.
 */
export function ThemeProfileRow() {
  const { tx } = useTranslation();
  const { isDark, setTheme } = useRovexoTheme();

  return (
    <label
      htmlFor="ac-canonical-theme-switch"
      className={cn("cds-menu-row ac-theme-row ac-holiday-mode-row")}
      data-theme-switch="v1.0"
      data-profile-theme-row="v1.0"
      data-theme-state={isDark ? "on" : "off"}
      data-rovexo-theme={isDark ? "dark" : "light"}
    >
      <span className="cds-menu-row__icon" aria-hidden>
        <ProfileMenuIcon id="theme" />
      </span>
      <span className="cds-menu-row__copy">
        <span className="cds-menu-row__title">
          <span className="truncate">{tx("Theme")}</span>
        </span>
      </span>
      <span className="cds-menu-row__trailing-group">
        <CanonicalSwitch
          id="ac-canonical-theme-switch"
          label={tx("Theme")}
          checked={isDark}
          onChange={(next) => setTheme(next ? "dark" : "light")}
          controlOnly
        />
      </span>
    </label>
  );
}

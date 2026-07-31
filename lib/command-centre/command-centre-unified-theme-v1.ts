/**
 * ROVEXO Command Centre — Unified White Theme RC1
 * Admin + Super Admin share one design system. Role only changes modules.
 */

export const COMMAND_CENTRE_UNIFIED_THEME_V1 = {
  id: "command-centre-unified-theme-v1",
  version: "1.0.0",
  status: "RC1",
  defaultAppearance: "light",
  storageKey: "rovexo.command-centre.appearance",
} as const;

export type CommandCentreAppearance = "light" | "dark";
export type CommandCentreVariant = "admin" | "super_admin";

export function resolveCommandCentreTitle(variant: CommandCentreVariant): string {
  return variant === "super_admin"
    ? "Super Admin Command Centre"
    : "Admin Command Centre";
}

export function resolveCommandCentreHomeHref(variant: CommandCentreVariant): string {
  return variant === "super_admin" ? "/super-admin" : "/admin";
}

export function parseCommandCentreAppearance(raw: string | null | undefined): CommandCentreAppearance {
  return raw === "dark" ? "dark" : "light";
}

const appearanceListeners = new Set<() => void>();

function readStoredAppearance(): CommandCentreAppearance {
  try {
    return parseCommandCentreAppearance(
      window.localStorage.getItem(COMMAND_CENTRE_UNIFIED_THEME_V1.storageKey),
    );
  } catch {
    return COMMAND_CENTRE_UNIFIED_THEME_V1.defaultAppearance;
  }
}

/** Client snapshot for `useSyncExternalStore` (same-tab + cross-tab). */
export function subscribeCommandCentreAppearance(onStoreChange: () => void): () => void {
  appearanceListeners.add(onStoreChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === COMMAND_CENTRE_UNIFIED_THEME_V1.storageKey) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    appearanceListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function getCommandCentreAppearanceSnapshot(): CommandCentreAppearance {
  return readStoredAppearance();
}

export function getCommandCentreAppearanceServerSnapshot(): CommandCentreAppearance {
  return COMMAND_CENTRE_UNIFIED_THEME_V1.defaultAppearance;
}

export function setCommandCentreAppearance(next: CommandCentreAppearance): void {
  try {
    window.localStorage.setItem(COMMAND_CENTRE_UNIFIED_THEME_V1.storageKey, next);
  } catch {
    /* ignore */
  }
  appearanceListeners.forEach((listener) => listener());
}

import type { MenuBuilderConfig } from "@/lib/platform-visual/types";
import type { NavigationSurface } from "@/lib/design-studio-v1/types";

export function buildNavigationSurfaces(menus: MenuBuilderConfig): NavigationSurface[] {
  const surfaces: NavigationSurface[] = [
    {
      id: "desktop-nav",
      label: "Desktop Navigation",
      type: "desktop",
      itemCount: menus.desktopNav.filter((i) => i.enabled).length,
      items: menus.desktopNav.slice(0, 8).map((i) => ({ id: i.id, label: i.label, href: i.href, enabled: i.enabled })),
      previewHref: "/super-admin/visual-cms?tab=preview",
    },
    {
      id: "mobile-nav",
      label: "Mobile Navigation",
      type: "mobile",
      itemCount: menus.mobileNav.filter((i) => i.enabled).length,
      items: menus.mobileNav.slice(0, 8).map((i) => ({ id: i.id, label: i.label, href: i.href, enabled: i.enabled })),
      previewHref: "/super-admin/visual-cms?tab=preview",
    },
    {
      id: "bottom-nav",
      label: "Bottom Navigation",
      type: "mobile",
      itemCount: menus.bottomNav.filter((i) => i.enabled).length,
      items: menus.bottomNav.map((i) => ({ id: i.id, label: i.label, href: i.href, enabled: i.enabled })),
      previewHref: "/",
    },
    {
      id: "footer-nav",
      label: "Footer",
      type: "footer",
      itemCount: menus.footerNav.filter((i) => i.enabled).length,
      items: menus.footerNav.slice(0, 6).map((i) => ({ id: i.id, label: i.label, href: i.href, enabled: i.enabled })),
      previewHref: "/",
    },
    {
      id: "account-nav",
      label: "Account Navigation",
      type: "sidebar",
      itemCount: menus.accountNav.filter((i) => i.enabled).length,
      items: menus.accountNav.slice(0, 8).map((i) => ({ id: i.id, label: i.label, href: i.href, enabled: i.enabled })),
      previewHref: "/account",
    },
    {
      id: "top-nav",
      label: "Top Navigation",
      type: "desktop",
      itemCount: menus.topNav.filter((i) => i.enabled).length,
      items: menus.topNav.slice(0, 6).map((i) => ({ id: i.id, label: i.label, href: i.href, enabled: i.enabled })),
      previewHref: "/",
    },
  ];

  return surfaces;
}

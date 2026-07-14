"use client";

import type { ReactNode } from "react";
import { DashboardIcon3D, resolveDashboardIconType } from "@/components/icons/DashboardIcon3D";
import { Fluency3DIcon } from "@/components/icons/Fluency3DIcon";
import { HomeCategoryIconImage } from "@/components/home/HomeCategoryIconImage";
import { ROVEXO_HOME_CATEGORY_RAIL } from "@/lib/home/category-premium-library";
import { resolveSuperAdminIconKey } from "@/lib/icons/fluency-3d-registry";
import { SUPER_ADMIN_NAV } from "@/lib/super-admin/nav";

const BUYER_LINKS = [
  { href: "/orders", label: "Orders" },
  { href: "/messages", label: "Messages" },
  { href: "/notifications", label: "Notifications" },
  { href: "/saved", label: "Saved" },
  { href: "/trust", label: "Trust Centre" },
  { href: "/resolution", label: "Resolution Centre" },
  { href: "/assistant", label: "AI Assistant" },
  { href: "/support", label: "Support" },
  { href: "/plans", label: "Premium Plans" },
  { href: "/categories", label: "Browse Categories" },
  { href: "/cart", label: "Cart" },
  { href: "/search", label: "Search" },
  { href: "/auctions", label: "Auctions" },
  { href: "/wallet", label: "Wallet" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/wallet/payment-methods", label: "Payment Methods" },
  { href: "/account/settings", label: "Settings" },
  { href: "/seller/reviews", label: "Reviews" },
  { href: "/saved", label: "Watchlist" },
  { href: "/search", label: "Recently Viewed" },
] as const;

const SELLER_LINKS = [
  { href: "/seller/dashboard", label: "Seller Dashboard" },
  { href: "/seller/listings", label: "Listings" },
  { href: "/seller/orders", label: "Orders" },
  { href: "/seller/analytics", label: "Analytics" },
  { href: "/seller/wallet", label: "Wallet" },
  { href: "/seller/shipping", label: "Shipping" },
  { href: "/seller/inventory", label: "Inventory" },
  { href: "/seller/promotions", label: "Promotions" },
  { href: "/seller/coupons", label: "Coupons" },
  { href: "/seller/returns", label: "Returns" },
  { href: "/seller/performance", label: "Performance" },
  { href: "/seller/reports", label: "Reports" },
  { href: "/seller/reviews", label: "Reviews" },
  { href: "/messages", label: "Messages" },
  { href: "/seller/customers", label: "Customers" },
] as const;

const ACCOUNT_LINKS = [
  { href: "/account/profile", label: "Profile" },
  { href: "/account/security", label: "Security" },
  { href: "/account/privacy", label: "Privacy" },
  { href: "/trust", label: "Verification" },
  { href: "/notifications/settings", label: "Notifications" },
  { href: "/account/preferences/language", label: "Language" },
  { href: "/help", label: "Help" },
  { href: "/support", label: "Contact" },
  { href: "/account", label: "Logout" },
] as const;

const BUSINESS_LINKS = [
  { href: "/business", label: "Business Dashboard" },
  { href: "/business/profile", label: "Company Profile" },
  { href: "/business/employees", label: "Employees" },
  { href: "/business/analytics", label: "Analytics" },
  { href: "/business/advertising", label: "Advertising" },
  { href: "/business/marketing", label: "Marketing" },
  { href: "/business/finance", label: "Finance" },
  { href: "/business/reports", label: "Reports" },
] as const;

const HOMEPAGE_ACTIONS = [
  { icon: "home", label: "Home" },
  { icon: "search", label: "Search" },
  { icon: "sell", label: "Sell" },
  { icon: "saved", label: "Saved" },
  { icon: "account", label: "Account" },
  { icon: "cart", label: "Cart" },
  { icon: "notifications", label: "Notifications" },
] as const;

const OMEGA_PANELS = [
  { href: "/super-admin/mobile/omega", label: "OMEGA" },
  { href: "/super-admin/mobile/omega/executive-command", label: "Executive Command" },
  { href: "/super-admin/mission-control-engine", label: "Mission Control Engine" },
  { href: "/super-admin/ai-engine", label: "AI Engine" },
  { href: "/super-admin/security-engine", label: "SENTINEL" },
  { href: "/super-admin/operations", label: "SCAN" },
  { href: "/super-admin/module-registry", label: "Registry" },
] as const;

function PreviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-text-primary">{title}</h2>
      {children}
    </section>
  );
}

function IconTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-secondary/40 p-3 text-center">
      <div className="flex h-12 w-12 items-center justify-center">{children}</div>
      <span className="text-xs font-medium text-text-secondary">{label}</span>
    </div>
  );
}

function LinkGrid({ links }: { links: readonly { href: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {links.map((link) => (
        <IconTile key={`${link.href}-${link.label}`} label={link.label}>
          <DashboardIcon3D type={resolveDashboardIconType(link.href)} size={36} />
        </IconTile>
      ))}
    </div>
  );
}

export default function Fluency3DPreviewPage() {
  const superAdminItems = SUPER_ADMIN_NAV.flatMap((section) => section.items);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">ROVEXO v1.0</p>
        <h1 className="text-3xl font-bold text-text-primary">Premium Studio Photography — Global Icon Preview</h1>
        <p className="max-w-3xl text-sm text-text-secondary">
          Photorealistic product studio icons with unified lighting, perspective, and soft shadows.
          One visual language across homepage categories and all dashboard navigation.
        </p>
      </header>

      <PreviewSection title="Homepage — Category Rail">
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
          {ROVEXO_HOME_CATEGORY_RAIL.map((category) => (
            <IconTile key={category.icon} label={category.name}>
              <HomeCategoryIconImage type={category.icon} variant="premium" size={48} />
            </IconTile>
          ))}
        </div>
      </PreviewSection>

      <PreviewSection title="Homepage — Actions & Search">
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
          {HOMEPAGE_ACTIONS.map((item) => (
            <IconTile key={item.icon} label={item.label}>
              <Fluency3DIcon icon={item.icon} size={36} />
            </IconTile>
          ))}
        </div>
      </PreviewSection>

      <PreviewSection title="Buyer Dashboard">
        <LinkGrid links={BUYER_LINKS} />
      </PreviewSection>

      <PreviewSection title="Seller Dashboard">
        <LinkGrid links={SELLER_LINKS} />
      </PreviewSection>

      <PreviewSection title="Business Dashboard">
        <LinkGrid links={BUSINESS_LINKS} />
      </PreviewSection>

      <PreviewSection title="Account Menu">
        <LinkGrid links={ACCOUNT_LINKS} />
      </PreviewSection>

      <PreviewSection title="Super Admin">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {superAdminItems.map((item) => (
            <IconTile key={item.href} label={item.label}>
              <Fluency3DIcon icon={resolveSuperAdminIconKey(item.href)} size={32} />
            </IconTile>
          ))}
        </div>
      </PreviewSection>

      <PreviewSection title="OMEGA & Executive Panels">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {OMEGA_PANELS.map((panel) => (
            <IconTile key={panel.href} label={panel.label}>
              <Fluency3DIcon icon={resolveSuperAdminIconKey(panel.href)} size={40} />
            </IconTile>
          ))}
        </div>
      </PreviewSection>

      <p className="text-center text-xs text-text-muted">
        Premium studio product photography · Pexels royalty-free sources · Unified ROVEXO visual system
      </p>
    </main>
  );
}

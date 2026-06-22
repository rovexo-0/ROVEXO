import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireRole(["admin"]);
  } catch {
    redirect("/account");
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <header className="border-b border-border bg-surface px-ds-4 py-ds-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-ds-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">ROVEXO Admin</p>
            <h1 className="text-lg font-semibold">Operations</h1>
          </div>
          <nav className="flex flex-wrap gap-x-ds-3 gap-y-ds-1 text-sm font-medium">
            <Link href="/admin" className="text-primary">Dashboard</Link>
            <Link href="/admin/operations" className="text-text-secondary hover:text-text-primary">Operations</Link>
            <Link href="/admin/analytics" className="text-text-secondary hover:text-text-primary">Analytics</Link>
            <Link href="/admin/help" className="text-text-secondary hover:text-text-primary">Help</Link>
            <Link href="/admin/trust" className="text-text-secondary hover:text-text-primary">Trust</Link>
            <Link href="/admin/business" className="text-text-secondary hover:text-text-primary">Business</Link>
            <Link href="/admin/wholesale" className="text-text-secondary hover:text-text-primary">Wholesale</Link>
            <Link href="/admin/monetization" className="text-text-secondary hover:text-text-primary">Monetization</Link>
            <Link href="/admin/orders" className="text-text-secondary hover:text-text-primary">Orders</Link>
            <Link href="/admin/promotions" className="text-text-secondary hover:text-text-primary">Promotions</Link>
            <Link href="/admin/moderation" className="text-text-secondary hover:text-text-primary">Moderation</Link>
            <Link href="/admin/categories" className="text-text-secondary hover:text-text-primary">Categories</Link>
            <Link href="/admin/seo" className="text-text-secondary hover:text-text-primary">SEO</Link>
            <Link href="/admin/protection" className="text-text-secondary hover:text-text-primary">Protection</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-ds-4 py-ds-6">{children}</main>
    </div>
  );
}

export async function generateMetadata() {
  return { title: "Admin | ROVEXO", robots: { index: false, follow: false } };
}

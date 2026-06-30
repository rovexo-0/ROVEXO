import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";

export default async function AdminLayout({ children: _children }: { children: React.ReactNode }) {
  void _children;
  try {
    await requireRole(["super_admin"]);
  } catch {
    redirect("/403");
  }

  redirect("/super-admin");
}

export async function generateMetadata() {
  return { title: "Admin | ROVEXO", robots: { index: false, follow: false } };
}

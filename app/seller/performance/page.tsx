import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SellerPerformanceDashboardView } from "@/features/seller-performance/components/SellerPerformanceDashboardView";
import { getAuthContext } from "@/lib/auth/session";
import { getSellerPerformanceDashboard } from "@/lib/seller-performance/service";

export const metadata: Metadata = {
  title: "Performance · ROVEXO",
  description: "Seller performance score and factors.",
};

export default async function SellerPerformancePage() {
  const auth = await getAuthContext();
  if (!auth) {
    redirect("/login?next=/seller/performance");
  }

  const data = await getSellerPerformanceDashboard(auth.user.id);
  return <SellerPerformanceDashboardView data={data} />;
}

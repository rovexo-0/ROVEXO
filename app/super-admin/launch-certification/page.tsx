import type { Metadata } from "next";
import { CertificationDashboard } from "@/features/super-admin/launch-certification/CertificationDashboard";

export const metadata: Metadata = {
  title: "Launch Certification",
  robots: { index: false, follow: false },
};

export default function LaunchCertificationPage() {
  return <CertificationDashboard />;
}

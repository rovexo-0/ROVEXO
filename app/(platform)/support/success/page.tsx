import type { Metadata } from "next";
import { SupportSuccessPage } from "@/features/support/components/SupportSuccessPage";

export const metadata: Metadata = {
  title: "Support request received | ROVEXO",
  robots: { index: false, follow: false },
};

type SupportSuccessRouteProps = {
  searchParams: Promise<{ ticket?: string }>;
};

export default async function SupportSuccessRoute({ searchParams }: SupportSuccessRouteProps) {
  const params = await searchParams;
  return <SupportSuccessPage ticketNumber={params.ticket} />;
}

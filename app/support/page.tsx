import type { Metadata } from "next";
import { SupportPage } from "@/features/support/components/SupportForm";

export const metadata: Metadata = {
  title: "Contact Support | ROVEXO",
  description: "Contact ROVEXO Support for account, order, payment, and moderation help.",
};

export default function SupportRoute() {
  return <SupportPage />;
}

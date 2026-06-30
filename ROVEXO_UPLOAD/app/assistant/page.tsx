import type { Metadata } from "next";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { MarketplaceAssistantPage } from "@/features/ai-assistant/components/MarketplaceAssistantPage";

export const metadata: Metadata = {
  title: "AI Assistant | ROVEXO",
  description: "Enterprise marketplace assistant integrated with Help Center and Trust Center.",
};

export default function AssistantPage() {
  return (
    <BetaAppShell showBottomNav={false}>
      <MarketplaceAssistantPage />
    </BetaAppShell>
  );
}

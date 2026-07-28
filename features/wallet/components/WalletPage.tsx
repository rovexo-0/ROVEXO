import { WalletHubV1 } from "@/features/wallet/components/WalletHubV1";
import type { WalletData } from "@/lib/wallet/types";

type WalletPageProps = {
  data: WalletData;
  backHref?: string;
  connectMessage?: string;
  variant?: "personal" | "business";
  isBusinessVerified?: boolean;
};

export function WalletPage({
  data,
  backHref,
  connectMessage,
  variant = "personal",
  isBusinessVerified = false,
}: WalletPageProps) {
  return (
    <WalletHubV1
      data={data}
      backHref={backHref}
      connectMessage={connectMessage}
      variant={variant}
      isBusinessVerified={isBusinessVerified}
    />
  );
}

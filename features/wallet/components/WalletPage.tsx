import { WalletHubV1 } from "@/features/wallet/components/WalletHubV1";
import type { WalletData } from "@/lib/wallet/types";

type WalletPageProps = {
  data: WalletData;
  userId: string;
  backHref?: string;
  connectMessage?: string;
  variant?: "personal" | "business";
  isBusinessVerified?: boolean;
};

export function WalletPage({
  data,
  userId,
  backHref,
  connectMessage,
  variant = "personal",
  isBusinessVerified = false,
}: WalletPageProps) {
  return (
    <WalletHubV1
      data={data}
      userId={userId}
      backHref={backHref}
      connectMessage={connectMessage}
      variant={variant}
      isBusinessVerified={isBusinessVerified}
    />
  );
}

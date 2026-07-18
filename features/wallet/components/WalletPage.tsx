import { WalletHubV1 } from "@/features/wallet/components/WalletHubV1";
import type { WalletData } from "@/lib/wallet/types";

type WalletPageProps = {
  data: WalletData;
  backHref?: string;
  connectMessage?: string;
  variant?: "personal" | "business";
};

export function WalletPage({ data, backHref, connectMessage, variant = "personal" }: WalletPageProps) {
  return (
    <WalletHubV1 data={data} backHref={backHref} connectMessage={connectMessage} variant={variant} />
  );
}

import { WalletHubV1 } from "@/features/wallet/components/WalletHubV1";
import type { SellerCommerceSummary } from "@/lib/commerce-engine/read-model";
import type { WalletData } from "@/lib/wallet/types";

type WalletPageProps = {
  data: WalletData;
  commerceSummary?: SellerCommerceSummary;
  backHref?: string;
  connectMessage?: string;
};

export function WalletPage({ data, commerceSummary, backHref, connectMessage }: WalletPageProps) {
  return (
    <WalletHubV1
      data={data}
      commerceSummary={commerceSummary}
      backHref={backHref}
      connectMessage={connectMessage}
    />
  );
}

import { WalletHubV1 } from "@/features/wallet/components/WalletHubV1";
import type { WalletData } from "@/lib/wallet/types";

type WalletPageProps = {
  data: WalletData;
  backHref?: string;
  connectMessage?: string;
};

export function WalletPage({ data, backHref, connectMessage }: WalletPageProps) {
  return <WalletHubV1 data={data} backHref={backHref} connectMessage={connectMessage} />;
}

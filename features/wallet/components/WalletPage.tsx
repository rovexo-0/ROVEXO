import { WalletHubV1 } from "@/features/wallet/components/WalletHubV1";
import { buildMonthlyStatements, sellerHasStatements } from "@/lib/wallet/monthly-statements";
import type { WalletData } from "@/lib/wallet/types";

type WalletPageProps = {
  data: WalletData;
  backHref?: string;
  connectMessage?: string;
  showStatements?: boolean;
};

export function WalletPage({ data, backHref, connectMessage, showStatements }: WalletPageProps) {
  return (
    <WalletHubV1
      data={data}
      backHref={backHref}
      connectMessage={connectMessage}
      showStatements={showStatements}
    />
  );
}

export async function resolveWalletShowStatements(userId: string): Promise<boolean> {
  const statements = await buildMonthlyStatements(userId);
  return sellerHasStatements(statements);
}
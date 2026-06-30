import { Badge } from "@/components/ui/Badge";
import { getTransactionStatusLabel, getTransactionStatusVariant } from "@/lib/wallet/utils";
import type { WalletTransactionStatus } from "@/lib/wallet/types";

type TransactionStatusBadgeProps = {
  status: WalletTransactionStatus;
};

export function TransactionStatusBadge({ status }: TransactionStatusBadgeProps) {
  return (
    <Badge variant={getTransactionStatusVariant(status)}>
      {getTransactionStatusLabel(status)}
    </Badge>
  );
}

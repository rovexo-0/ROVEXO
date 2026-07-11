import { redirect } from "next/navigation";

type SellerWalletTransactionRedirectProps = {
  params: Promise<{ id: string }>;
};

export default async function SellerWalletTransactionRedirect({
  params,
}: SellerWalletTransactionRedirectProps) {
  const { id } = await params;
  redirect(`/wallet/transactions/${id}`);
}

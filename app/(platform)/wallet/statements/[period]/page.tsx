import { redirect } from "next/navigation";
import { MonthlyStatementDetail } from "@/features/wallet/components/MonthlyStatementDetail";
import { getMonthlyStatement } from "@/lib/wallet/monthly-statements";
import { fetchProfile } from "@/lib/profile/queries";

type StatementDetailRouteProps = {
  params: Promise<{ period: string }>;
};

export default async function WalletStatementDetailRoute({ params }: StatementDetailRouteProps) {
  const profile = await fetchProfile();
  if (!profile) {
    redirect("/login?next=/wallet/statements");
  }

  const { period } = await params;
  const statement = await getMonthlyStatement(profile.id, period);
  if (!statement) {
    redirect("/wallet/statements");
  }

  return <MonthlyStatementDetail statement={statement} />;
}

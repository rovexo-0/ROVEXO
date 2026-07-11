import { redirect, notFound } from "next/navigation";
import { AnnualStatementDetail } from "@/features/wallet/components/AnnualStatementDetail";
import { getAnnualStatement } from "@/lib/wallet/monthly-statements";
import { fetchProfile } from "@/lib/profile/queries";

type AnnualStatementRouteProps = {
  params: Promise<{ year: string }>;
};

export default async function WalletAnnualStatementDetailRoute({ params }: AnnualStatementRouteProps) {
  const profile = await fetchProfile();
  if (!profile) {
    redirect("/login?next=/wallet/statements/annual");
  }

  const { year } = await params;
  const statement = await getAnnualStatement(profile.id, year);
  if (!statement) {
    notFound();
  }

  return <AnnualStatementDetail statement={statement} />;
}

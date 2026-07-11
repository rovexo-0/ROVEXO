import { redirect } from "next/navigation";
import { MonthlyStatementsList } from "@/features/wallet/components/MonthlyStatementsList";
import { buildMonthlyStatements, sellerHasStatements } from "@/lib/wallet/monthly-statements";
import { fetchProfile } from "@/lib/profile/queries";

export default async function WalletStatementsRoute() {
  const profile = await fetchProfile();
  if (!profile) {
    redirect("/login?next=/wallet/statements");
  }

  const statements = await buildMonthlyStatements(profile.id);
  if (!sellerHasStatements(statements)) {
    redirect("/wallet");
  }

  return <MonthlyStatementsList statements={statements} />;
}

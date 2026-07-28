import { redirect } from "next/navigation";
import { AnnualStatementsList } from "@/features/wallet/components/AnnualStatementsList";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import { buildAnnualStatementsForUser, buildMonthlyStatements, sellerHasStatements } from "@/lib/wallet/monthly-statements";
import { fetchProfile } from "@/lib/profile/queries";

export default async function WalletAnnualStatementsRoute() {
  const profile = await fetchProfile();
  if (!profile) {
    redirect("/login?next=/wallet/statements/annual");
  }

  const monthly = await buildMonthlyStatements(profile.id);
  if (!sellerHasStatements(monthly)) {
    redirect(WALLET_ROUTES.hub);
  }

  const statements = await buildAnnualStatementsForUser(profile.id);
  return <AnnualStatementsList statements={statements} />;
}

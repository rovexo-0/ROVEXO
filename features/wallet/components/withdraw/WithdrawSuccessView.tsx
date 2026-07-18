import { PublishedCheckmark } from "@/features/sell/components/PublishedCheckmark";
import {
  CanonicalButtonLink,
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalSection,
} from "@/src/components/canonical";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

export function WithdrawSuccessView() {
  return (
    <CanonicalSection title="Withdrawal requested">
      <CanonicalCard variant="medium" className="flex w-full flex-col items-center gap-ds-4 p-ds-4 text-center">
        <PublishedCheckmark />
        <CanonicalInfoBlock variant="description">
          Funds will arrive per your payout schedule.
        </CanonicalInfoBlock>
        <div className="flex w-full flex-col gap-ds-3">
          <CanonicalButtonLink href={WALLET_ROUTES.hub} fullWidth>
            Done
          </CanonicalButtonLink>
          <CanonicalButtonLink href={`${WALLET_ROUTES.transactions}#wallet-transactions-heading`} variant="secondary" fullWidth>
            View transactions
          </CanonicalButtonLink>
        </div>
      </CanonicalCard>
    </CanonicalSection>
  );
}

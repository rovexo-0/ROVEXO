import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PublishedCheckmark } from "@/features/sell/components/PublishedCheckmark";

export function WithdrawSuccessView() {
  return (
    <section
      className="flex w-full flex-col items-center justify-center px-ds-2 py-ds-8 text-center"
      aria-labelledby="withdraw-success-heading"
    >
      <PublishedCheckmark />

      <h2 id="withdraw-success-heading" className="mt-ds-6 text-xl font-semibold text-text-primary">
        Withdrawal Requested
      </h2>

      <p className="mt-ds-2 max-w-sm text-sm text-text-secondary">
        Funds will arrive according to your payout schedule.
      </p>

      <div className="mt-ds-8 flex w-full max-w-sm flex-col gap-ds-3">
        <Link href="/seller/wallet" className="block w-full">
          <Button variant="primary" fullWidth size="lg" className="min-h-ds-7 rounded-ds-lg text-base">
            Done
          </Button>
        </Link>

        <Link href="/seller/wallet#wallet-transactions-heading" className="block w-full">
          <Button variant="secondary" fullWidth size="lg" className="min-h-ds-7 rounded-ds-lg text-base">
            View Transactions
          </Button>
        </Link>
      </div>
    </section>
  );
}

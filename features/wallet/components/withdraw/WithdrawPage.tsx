"use client";

import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { WalletHeader } from "@/features/wallet/components/WalletHeader";
import { WithdrawAmountStep } from "@/features/wallet/components/withdraw/WithdrawAmountStep";
import { WithdrawMethodStep } from "@/features/wallet/components/withdraw/WithdrawMethodStep";
import { WithdrawReviewStep } from "@/features/wallet/components/withdraw/WithdrawReviewStep";
import { WithdrawSuccessView } from "@/features/wallet/components/withdraw/WithdrawSuccessView";
import { useWithdrawFlow } from "@/features/wallet/hooks/use-withdraw-flow";
import type { WalletData } from "@/lib/wallet/types";
import type { UserProfile } from "@/lib/profile/types";

type WithdrawPageProps = {
  profile: UserProfile;
  data: WalletData;
};

function stepTitle(step: ReturnType<typeof useWithdrawFlow>["step"]): string {
  switch (step) {
    case "method":
      return "Withdraw";
    case "amount":
      return "Enter Amount";
    case "review":
      return "Review";
    case "success":
      return "Withdraw";
  }
}

export function WithdrawPage({ profile, data }: WithdrawPageProps) {
  const flow = useWithdrawFlow({
    availableBalance: data.availableBalance,
    methods: data.withdrawMethods,
  });

  const isSuccess = flow.step === "success";
  const showInternalBack = !isSuccess && flow.step !== "method";

  return (
    <BetaAppShell showBottomNav={false}>
      {!isSuccess && (
        <WalletHeader
          title={stepTitle(flow.step)}
          backHref="/seller/wallet"
          onBack={showInternalBack ? flow.goBack : undefined}
          unreadNotifications={profile.unreadNotifications}
        />
      )}

      <HubPageMain withBottomNav={false}
        className={cn(
          "mx-auto flex w-full max-w-2xl flex-col",
          isSuccess
            ? "min-h-[100dvh] justify-center px-ds-4 py-ds-6"
            : "gap-ds-5 px-ds-4 py-ds-4 ",
        )}
      >
        {isSuccess ? (
          <WithdrawSuccessView />
        ) : (
          <>
            {flow.step === "method" && <WithdrawMethodStep flow={flow} />}
            {flow.step === "amount" && <WithdrawAmountStep flow={flow} />}
            {flow.step === "review" && <WithdrawReviewStep flow={flow} />}
            {flow.error && (
              <p className="text-sm text-danger" role="alert">
                {flow.error}
              </p>
            )}
          </>
        )}
      </HubPageMain>

      {!isSuccess && (
        <footer className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 px-ds-4 py-ds-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur-xl">
          <div className="mx-auto w-full max-w-2xl">
            {flow.step === "review" ? (
              <Button
                variant="primary"
                fullWidth
                size="lg"
                className="min-h-ds-7 rounded-ds-lg"
                disabled={flow.isSubmitting}
                onClick={() => void flow.confirmWithdraw()}
              >
                {flow.isSubmitting ? "Processing…" : "Confirm Withdrawal"}
              </Button>
            ) : (
              <Button
                variant="primary"
                fullWidth
                size="lg"
                className="min-h-ds-7 rounded-ds-lg"
                disabled={!flow.canContinue}
                onClick={flow.goNext}
              >
                Continue
              </Button>
            )}
          </div>
        </footer>
      )}
    </BetaAppShell>
  );
}

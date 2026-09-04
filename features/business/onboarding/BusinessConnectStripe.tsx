"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CanonicalButton } from "@/src/components/canonical";
import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";
import { BusinessFlowHeader } from "@/features/business/onboarding/BusinessFlowHeader";
import type { BusinessStripeStatus } from "@/lib/business/business-onboarding-contract-v1";
import "@/styles/rovexo/business-onboarding-v1.css";

type BusinessConnectStripeProps = {
  stage: "intro" | "onboarding";
  stripe: BusinessStripeStatus;
};

export function BusinessConnectStripe({ stage, stripe }: BusinessConnectStripeProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [message, setMessage] = useState<string | null>(
    stripe.state === "action_required"
      ? "Stripe needs more information before your business can be verified."
      : null,
  );

  async function startStripe() {
    if (loading) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/business/connect", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surface: "pwa",
          runtimeOrigin: window.location.origin,
        }),
      });
      const json = (await response.json()) as { url?: string; error?: string; nextStep?: string };
      if (response.status === 409 && json.nextStep === "information") {
        router.replace("/business/information");
        return;
      }
      if (!response.ok || !json.url) {
        setMessage(json.error ?? "Unable to start Stripe Connect.");
        setLoading(false);
        return;
      }
      window.location.assign(json.url);
    } catch {
      setFailed(true);
      setLoading(false);
    }
  }

  if (failed) {
    return <FailClosedPanel onRetry={() => setFailed(false)} />;
  }

  if (stage === "onboarding") {
    return (
      <div className="biz-flow" data-business-connect="onboarding">
        <BusinessFlowHeader active="stripe" informationDone />
        <div className="biz-flow__graphic" aria-hidden>
          <span>👨‍💼</span>
          <span>→</span>
          <span>🏛️</span>
        </div>
        <div className="biz-flow__checks">
          <p className="biz-flow__check">✓ You may need to provide business details.</p>
          <p className="biz-flow__check">✓ Stripe will verify your business.</p>
          <p className="biz-flow__check">✓ Once approved, payouts will be enabled.</p>
        </div>
        {message ? <p className="biz-flow__error">{message}</p> : null}
        <CanonicalButton type="button" loading={loading} disabled={loading} onClick={() => void startStripe()}>
          → Continue to Stripe
        </CanonicalButton>
        <p className="biz-flow__warn">
          <span aria-hidden>⚠️</span>
          You will leave Rovexo and go to Stripe.
        </p>
      </div>
    );
  }

  return (
    <div className="biz-flow" data-business-connect="intro">
      <BusinessFlowHeader active="stripe" informationDone />
      <div className="biz-flow__stripe-mark" aria-label="Stripe">
        stripe
      </div>
      <h1 className="biz-flow__title">Connect your account with Stripe.</h1>
      <div className="biz-flow__benefits">
        <div className="biz-flow__benefit">
          <span className="biz-flow__benefit-emoji" aria-hidden>
            🔒
          </span>
          <div>
            <h3>Secure and trusted</h3>
            <p>Handled by Stripe.</p>
          </div>
        </div>
        <div className="biz-flow__benefit">
          <span className="biz-flow__benefit-emoji" aria-hidden>
            🛡️
          </span>
          <div>
            <h3>Business verification</h3>
            <p>Completed by Stripe.</p>
          </div>
        </div>
        <div className="biz-flow__benefit">
          <span className="biz-flow__benefit-emoji" aria-hidden>
            💳
          </span>
          <div>
            <h3>Payouts to your bank</h3>
            <p>Get paid directly to your bank account.</p>
          </div>
        </div>
      </div>
      {message ? <p className="biz-flow__error">{message}</p> : null}
      <CanonicalButton type="button" loading={loading} disabled={loading} onClick={() => void startStripe()}>
        → Continue to Stripe
      </CanonicalButton>
      <p className="biz-flow__warn">
        <span aria-hidden>⚠️</span>
        You will leave Rovexo and go to Stripe.
      </p>
    </div>
  );
}

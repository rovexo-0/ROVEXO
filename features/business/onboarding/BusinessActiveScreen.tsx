"use client";

import { CanonicalButtonLink } from "@/src/components/canonical";
import { BusinessFlowHeader } from "@/features/business/onboarding/BusinessFlowHeader";
import "@/styles/rovexo/business-onboarding-v1.css";

export function BusinessActiveScreen() {
  return (
    <div className="biz-flow" data-business-active="v1">
      <BusinessFlowHeader active="review" informationDone stripeDone />
      <div className="biz-flow__success">
        <div className="biz-flow__success-mark" aria-hidden>
          ✅
        </div>
        <h1 className="biz-flow__title">You&apos;re all set!</h1>
        <p className="biz-flow__copy">Your business tools are active.</p>
      </div>
      <div className="biz-flow__checks">
        <p className="biz-flow__check">✓ Your business is verified by Stripe</p>
        <p className="biz-flow__check">🔓 You can start selling as a business</p>
        <p className="biz-flow__check">💼 Access all business tools</p>
      </div>
      <CanonicalButtonLink href="/business/dashboard">🏠 Go to Business Home</CanonicalButtonLink>
    </div>
  );
}

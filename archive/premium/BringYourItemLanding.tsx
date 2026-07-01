"use client";

import { BringYourItemCta } from "@/components/premium/BringYourItemCta";
import { IMPORT_WIZARD_PATH } from "@/lib/seller/migration/config";

export function BringYourItemLanding() {
  return (
    <main className="home-v1-bring-your-item-page">
      <div className="home-v1-bring-your-item-page__inner">
        <h1 className="home-v1-bring-your-item-page__title">Bring Your Item</h1>
        <p className="home-v1-bring-your-item-page__description">
          Import your listing from another marketplace in under 60 seconds. Connect your store, review
          your listings, and publish to ROVEXO with buyer protection and secure checkout.
        </p>
        <BringYourItemCta href={IMPORT_WIZARD_PATH}>Continue</BringYourItemCta>
      </div>
    </main>
  );
}

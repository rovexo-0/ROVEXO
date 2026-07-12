"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AccountCanonicalShell, AccountPageStack } from "@/features/account-canonical";
import {
  CanonicalButton,
  CanonicalButtonLink,
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalInput,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import { SELLER_REGISTRATION_OPTIONS, type SellerRegistrationType } from "@/lib/seller/tax/types";
import type { SellerTaxProfile } from "@/lib/seller/tax/types";

type SellerTaxRegistrationPageProps = {
  initialProfile: SellerTaxProfile | null;
  connectUrl?: string | null;
};

const TAX_TYPE_LABELS: Record<SellerRegistrationType, string> = {
  personal: "Personal",
  pro_seller: "Pro Seller",
  business_sole_trader: "Sole Trader",
  business_company: "Company",
};

type TaxStep = "type" | "form";

export function SellerTaxRegistrationPage({
  initialProfile,
  connectUrl,
}: SellerTaxRegistrationPageProps) {
  const router = useRouter();
  const [step, setStep] = useState<TaxStep>(initialProfile?.submittedAt ? "form" : "type");
  const [registrationType, setRegistrationType] = useState<SellerRegistrationType>(
    initialProfile?.registrationType ?? "personal",
  );
  const [form, setForm] = useState({
    fullName: initialProfile?.fullName ?? "",
    addressLine1: initialProfile?.addressLine1 ?? "",
    addressLine2: initialProfile?.addressLine2 ?? "",
    city: initialProfile?.city ?? "",
    postcode: initialProfile?.postcode ?? "",
    country: initialProfile?.country ?? "GB",
    email: initialProfile?.email ?? "",
    phone: initialProfile?.phone ?? "",
    nino: initialProfile?.nino ?? "",
    utr: initialProfile?.utr ?? "",
    companyName: initialProfile?.companyName ?? "",
    companyNumber: initialProfile?.companyNumber ?? "",
    registeredAddress: initialProfile?.registeredAddress ?? "",
    vatNumber: initialProfile?.vatNumber ?? "",
    directorName: initialProfile?.directorName ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const response = await fetch("/api/seller/tax", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationType, ...form }),
    });
    const payload = (await response.json()) as { success?: boolean; error?: string; connectUrl?: string };
    setSaving(false);

    if (!response.ok || !payload.success) {
      setError(payload.error ?? "Unable to save registration.");
      return;
    }

    if (payload.connectUrl) {
      window.location.href = payload.connectUrl;
      return;
    }

    router.refresh();
  };

  const showSoleTraderFields =
    registrationType === "pro_seller" ||
    registrationType === "business_sole_trader" ||
    registrationType === "personal";
  const showCompanyFields = registrationType === "business_company";

  const selectType = (type: SellerRegistrationType) => {
    setRegistrationType(type);
    setStep("form");
  };

  return (
    <AccountCanonicalShell title="Tax Information" backHref="/account/settings">
      <AccountPageStack>
        {step === "type" ? (
          <CanonicalSection title="Tax Information">
            <CanonicalCard variant="list">
              {SELLER_REGISTRATION_OPTIONS.map((option) => (
                <CanonicalMenuRow
                  key={option.id}
                  title={TAX_TYPE_LABELS[option.id]}
                  onClick={() => selectType(option.id)}
                  className="account-settings-tax-option"
                />
              ))}
            </CanonicalCard>
          </CanonicalSection>
        ) : (
          <>
            <CanonicalSection title={TAX_TYPE_LABELS[registrationType]}>
              <CanonicalCard variant="medium" className="flex flex-col gap-ds-4 p-ds-4">
                <CanonicalMenuRow title="Change seller type" onClick={() => setStep("type")} />

                {showSoleTraderFields ? (
                  <>
                    <CanonicalInput
                      id="fullName"
                      label="Full Name"
                      value={form.fullName}
                      onChange={(event) => update("fullName", event.target.value)}
                    />
                    <CanonicalInput
                      id="addressLine1"
                      label="Address"
                      value={form.addressLine1}
                      onChange={(event) => update("addressLine1", event.target.value)}
                    />
                    <CanonicalInput
                      id="addressLine2"
                      label="Address line 2"
                      value={form.addressLine2}
                      onChange={(event) => update("addressLine2", event.target.value)}
                    />
                    <CanonicalInput
                      id="city"
                      label="City"
                      value={form.city}
                      onChange={(event) => update("city", event.target.value)}
                    />
                    <CanonicalInput
                      id="postcode"
                      label="Postcode"
                      value={form.postcode}
                      onChange={(event) => update("postcode", event.target.value)}
                    />
                    <CanonicalInput
                      id="email"
                      label="Email"
                      value={form.email}
                      onChange={(event) => update("email", event.target.value)}
                    />
                    <CanonicalInput
                      id="phone"
                      label="Phone"
                      value={form.phone}
                      onChange={(event) => update("phone", event.target.value)}
                    />
                    {registrationType === "business_sole_trader" || registrationType === "pro_seller" ? (
                      <>
                        <CanonicalInput
                          id="nino"
                          label="NINO"
                          value={form.nino}
                          onChange={(event) => update("nino", event.target.value)}
                        />
                        <CanonicalInput
                          id="utr"
                          label="UTR"
                          value={form.utr}
                          onChange={(event) => update("utr", event.target.value)}
                        />
                      </>
                    ) : null}
                  </>
                ) : null}

                {showCompanyFields ? (
                  <>
                    <CanonicalInput
                      id="companyName"
                      label="Company Name"
                      value={form.companyName}
                      onChange={(event) => update("companyName", event.target.value)}
                    />
                    <CanonicalInput
                      id="companyNumber"
                      label="Company Number"
                      value={form.companyNumber}
                      onChange={(event) => update("companyNumber", event.target.value)}
                    />
                    <CanonicalInput
                      id="registeredAddress"
                      label="Registered Address"
                      value={form.registeredAddress}
                      onChange={(event) => update("registeredAddress", event.target.value)}
                    />
                    <CanonicalInput
                      id="vatNumber"
                      label="VAT Number"
                      value={form.vatNumber}
                      onChange={(event) => update("vatNumber", event.target.value)}
                    />
                    <CanonicalInput
                      id="directorName"
                      label="Director Name"
                      value={form.directorName}
                      onChange={(event) => update("directorName", event.target.value)}
                    />
                    <CanonicalInput
                      id="companyEmail"
                      label="Email"
                      value={form.email}
                      onChange={(event) => update("email", event.target.value)}
                    />
                    <CanonicalInput
                      id="companyPhone"
                      label="Phone"
                      value={form.phone}
                      onChange={(event) => update("phone", event.target.value)}
                    />
                  </>
                ) : null}

                {error ? <CanonicalInfoBlock variant="error">{error}</CanonicalInfoBlock> : null}

                <CanonicalButton disabled={saving} loading={saving} fullWidth onClick={() => void save()}>
                  Save
                </CanonicalButton>

                {connectUrl ? (
                  <CanonicalButtonLink href={connectUrl} variant="secondary" fullWidth>
                    Continue bank setup
                  </CanonicalButtonLink>
                ) : null}
              </CanonicalCard>
            </CanonicalSection>
          </>
        )}
      </AccountPageStack>
    </AccountCanonicalShell>
  );
}

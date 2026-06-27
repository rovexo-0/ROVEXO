"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SELLER_REGISTRATION_OPTIONS, type SellerRegistrationType } from "@/lib/seller/tax/types";
import type { SellerTaxProfile } from "@/lib/seller/tax/types";

type SellerTaxRegistrationPageProps = {
  initialProfile: SellerTaxProfile | null;
  connectUrl?: string | null;
};

export function SellerTaxRegistrationPage({
  initialProfile,
  connectUrl,
}: SellerTaxRegistrationPageProps) {
  const router = useRouter();
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

  return (
    <BetaAppShell showBottomNav={false}>
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-5 px-ds-4 py-ds-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Seller tax registration</h1>
          <p className="mt-ds-2 text-sm text-text-secondary">
            Register your seller type and connect Stripe to receive payouts.
          </p>
        </div>

        <Card padding="lg" className="">
          <fieldset className="grid gap-ds-3">
            <legend className="text-sm font-semibold text-text-primary">Registration type</legend>
            {SELLER_REGISTRATION_OPTIONS.map((option) => (
              <label key={option.id} className="flex cursor-pointer gap-ds-3 rounded-ds-md border border-border p-ds-3">
                <input
                  type="radio"
                  name="registrationType"
                  checked={registrationType === option.id}
                  onChange={() => setRegistrationType(option.id)}
                />
                <span>
                  <span className="block text-sm font-medium text-text-primary">{option.label}</span>
                  <span className="block text-xs text-text-secondary">{option.description}</span>
                </span>
              </label>
            ))}
          </fieldset>
        </Card>

        <Card padding="lg" className="">
          <div className="grid gap-ds-4">
            {showSoleTraderFields ? (
              <>
                <Field label="Full name" value={form.fullName} onChange={(value) => update("fullName", value)} />
                <Field label="Address line 1" value={form.addressLine1} onChange={(value) => update("addressLine1", value)} />
                <Field label="Address line 2" value={form.addressLine2} onChange={(value) => update("addressLine2", value)} />
                <Field label="City" value={form.city} onChange={(value) => update("city", value)} />
                <Field label="Postcode" value={form.postcode} onChange={(value) => update("postcode", value)} />
                <Field label="Email" value={form.email} onChange={(value) => update("email", value)} />
                <Field label="Phone" value={form.phone} onChange={(value) => update("phone", value)} />
                {(registrationType === "business_sole_trader" || registrationType === "pro_seller") && (
                  <>
                    <Field label="NINO (when required)" value={form.nino} onChange={(value) => update("nino", value)} />
                    <Field label="UTR (when applicable)" value={form.utr} onChange={(value) => update("utr", value)} />
                  </>
                )}
              </>
            ) : null}

            {showCompanyFields ? (
              <>
                <Field label="Company name" value={form.companyName} onChange={(value) => update("companyName", value)} />
                <Field
                  label="Company registration number"
                  value={form.companyNumber}
                  onChange={(value) => update("companyNumber", value)}
                />
                <Field
                  label="Registered address"
                  value={form.registeredAddress}
                  onChange={(value) => update("registeredAddress", value)}
                />
                <Field label="VAT number (when applicable)" value={form.vatNumber} onChange={(value) => update("vatNumber", value)} />
                <Field label="Director name" value={form.directorName} onChange={(value) => update("directorName", value)} />
                <Field label="Email" value={form.email} onChange={(value) => update("email", value)} />
                <Field label="Phone" value={form.phone} onChange={(value) => update("phone", value)} />
              </>
            ) : null}

            {error ? <p className="text-sm text-danger">{error}</p> : null}

            <Button disabled={saving} onClick={() => void save()}>
              Save and connect Stripe
            </Button>

            {connectUrl ? (
              <a
                href={connectUrl}
                className="inline-flex min-h-ds-7 items-center justify-center rounded-ds-full border border-border px-ds-5 text-sm font-medium"
              >
                Continue Stripe Connect
              </a>
            ) : null}
          </div>
        </Card>
      </main>
    </BetaAppShell>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-text-primary">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-ds-1 w-full rx-input px-ds-3 py-ds-2 text-sm"
      />
    </div>
  );
}

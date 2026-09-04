"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BUSINESS_TYPE_OPTIONS,
  businessInformationSchema,
  type BusinessInformationInput,
  type BusinessProfilePayload,
  type BusinessRegistrationType,
} from "@/lib/business/business-onboarding-contract-v1";
import { UK_DEFAULT_COUNTRY } from "@/lib/i18n/uk-first";
import { CanonicalButton, CanonicalInput, CanonicalSelector } from "@/src/components/canonical";
import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";
import { BusinessFlowHeader } from "@/features/business/onboarding/BusinessFlowHeader";
import "@/styles/rovexo/business-onboarding-v1.css";

type LookupAddress = {
  id: string;
  line1: string;
  line2: string;
  city: string;
  postcode: string;
  country: string;
  label: string;
};

type BusinessInformationFormProps = {
  initial: BusinessProfilePayload | null;
};

export function BusinessInformationForm({ initial }: BusinessInformationFormProps) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(initial?.businessName ?? "");
  const [addressLine, setAddressLine] = useState(initial?.addressLine ?? "");
  const [addressLine2, setAddressLine2] = useState(initial?.addressLine2 ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [postcode, setPostcode] = useState(initial?.postcode ?? "");
  const [contactEmail, setContactEmail] = useState(initial?.contactEmail ?? "");
  const [businessType, setBusinessType] = useState<BusinessRegistrationType | "">(
    initial?.businessType ?? "",
  );
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupResults, setLookupResults] = useState<LookupAddress[]>([]);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const payload = useMemo(
    (): BusinessInformationInput => ({
      businessName,
      contactEmail,
      businessType: (businessType || "business_sole_trader") as BusinessRegistrationType,
      addressLine,
      addressLine2,
      city,
      postcode,
      country: UK_DEFAULT_COUNTRY,
      vatNumber: initial?.vatNumber ?? "",
    }),
    [addressLine, addressLine2, businessName, businessType, city, contactEmail, initial?.vatNumber, postcode],
  );

  async function lookupAddress() {
    setLookupError(null);
    const query = postcode.trim() || addressLine.trim();
    if (!query) {
      setLookupError("Enter a UK postcode to look up your business address.");
      return;
    }
    try {
      const response = await fetch(`/api/addresses/lookup?postcode=${encodeURIComponent(query)}`, {
        credentials: "include",
      });
      const json = (await response.json()) as { addresses?: LookupAddress[]; error?: string };
      if (!response.ok) {
        setLookupError(json.error ?? "Address lookup temporarily unavailable.");
        return;
      }
      const addresses = json.addresses ?? [];
      setLookupResults(addresses);
      setLookupOpen(true);
      if (addresses.length === 0) {
        setLookupError("No addresses found for that postcode.");
      }
    } catch {
      setLookupError("Address lookup temporarily unavailable.");
    }
  }

  function selectAddress(address: LookupAddress) {
    setAddressLine(address.line1);
    setAddressLine2(address.line2 ?? "");
    setCity(address.city);
    setPostcode(address.postcode);
    setLookupOpen(false);
    setLookupError(null);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldError(null);
    const parsed = businessInformationSchema.safeParse({
      ...payload,
      businessType: businessType || undefined,
    });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Complete all required business information.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/business/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await response.json()) as { error?: string; verified?: boolean };
      if (!response.ok) {
        setFieldError(json.error ?? "Unable to save business information.");
        setSaving(false);
        return;
      }
      if (json.verified === true) {
        setFieldError("Business cannot be verified from this form.");
        setSaving(false);
        return;
      }
      router.push("/business/connect");
      router.refresh();
    } catch {
      setFailed(true);
      setSaving(false);
    }
  }

  if (failed) {
    return <FailClosedPanel onRetry={() => setFailed(false)} />;
  }

  return (
    <form className="biz-flow" onSubmit={onSubmit} data-business-information="v1" noValidate>
      <BusinessFlowHeader active="information" />
      <h1 className="biz-flow__title">Tell us about your business.</h1>
      <div className="biz-flow__fields">
        <CanonicalInput
          id="businessName"
          name="businessName"
          label="🏢 Business or trading name"
          placeholder="e.g. Oly Business Ltd"
          value={businessName}
          onChange={(event) => setBusinessName(event.target.value)}
          autoComplete="organization"
          required
        />
        <div className="biz-flow__lookup">
          <CanonicalInput
            id="addressLine"
            name="addressLine"
            label="📍 Business address"
            placeholder="Address line"
            value={addressLine}
            onChange={(event) => setAddressLine(event.target.value)}
            autoComplete="address-line1"
            required
          />
          <CanonicalInput
            id="postcode"
            name="postcode"
            label="Postcode"
            placeholder="e.g. SW1A 1AA"
            value={postcode}
            onChange={(event) => setPostcode(event.target.value)}
            autoComplete="postal-code"
            required
          />
          <CanonicalInput
            id="city"
            name="city"
            label="City"
            placeholder="City"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            autoComplete="address-level2"
            required
          />
          <CanonicalButton type="button" variant="outline" onClick={() => void lookupAddress()}>
            📍 Look up address
          </CanonicalButton>
          {lookupOpen && lookupResults.length > 0 ? (
            <div className="biz-flow__lookup-results" role="listbox" aria-label="Matching addresses">
              {lookupResults.map((address) => (
                <button
                  key={address.id}
                  type="button"
                  className="biz-flow__lookup-item"
                  onClick={() => selectAddress(address)}
                >
                  {address.label}
                </button>
              ))}
            </div>
          ) : null}
          {lookupError ? <p className="biz-flow__error">{lookupError}</p> : null}
        </div>
        <CanonicalInput
          id="contactEmail"
          name="contactEmail"
          inputType="email"
          label="📧 Contact email"
          placeholder="Your email"
          value={contactEmail}
          onChange={(event) => setContactEmail(event.target.value)}
          autoComplete="email"
          required
        />
        <CanonicalSelector
          id="businessType"
          name="businessType"
          label="💼 Business type"
          placeholder="Select business type"
          required
          value={businessType}
          onChange={(event) => setBusinessType(event.target.value as BusinessRegistrationType)}
          options={BUSINESS_TYPE_OPTIONS.map((option) => ({
            value: option.id,
            label: option.label,
          }))}
        />
      </div>
      <div className="biz-flow__note">
        <span className="biz-flow__note-emoji" aria-hidden>
          ℹ️
        </span>
        <span>This information is used to create your business profile and connect Stripe.</span>
      </div>
      {fieldError ? <p className="biz-flow__error">{fieldError}</p> : null}
      <CanonicalButton type="submit" loading={saving} disabled={saving}>
        → Continue
      </CanonicalButton>
    </form>
  );
}

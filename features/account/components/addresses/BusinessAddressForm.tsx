"use client";

import type { FormEventHandler } from "react";
import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import {
  CanonicalButton,
  CanonicalInput,
  CanonicalSwitch,
} from "@/src/components/canonical";
import { UK_DEFAULT_COUNTRY } from "@/lib/i18n/uk-first";
import type { AddressInput } from "@/lib/account/schemas";
import type { UkLookupResult } from "@/features/account/components/addresses/types";
import type { AddressFormExtras } from "@/features/account/components/addresses/AddressForm";
import { cn } from "@/lib/cn";

type BusinessAddressFormProps = {
  register: UseFormRegister<AddressInput>;
  errors: FieldErrors<AddressInput>;
  isSubmitting: boolean;
  isEditing: boolean;
  isDefault: boolean;
  setValue: UseFormSetValue<AddressInput>;
  extras: AddressFormExtras;
  onExtrasChange: (patch: Partial<AddressFormExtras>) => void;
  vatRegistered: boolean;
  onVatRegisteredChange: (value: boolean) => void;
  lookupPostcode: string;
  onLookupPostcodeChange: (value: string) => void;
  lookupLoading: boolean;
  lookupResults: UkLookupResult[];
  lookupSelected: boolean;
  onSearch: () => void;
  onSelectLookup: (result: UkLookupResult) => void;
  watchedLine1?: string;
  watchedLine2?: string;
  watchedCity?: string;
  watchedPostcode?: string;
  /** Blocks Enter-key form submit; save is lookup-select only. */
  onSubmit: FormEventHandler<HTMLFormElement>;
};

/**
 * Business Add / Edit Address form (Owner contract fields).
 * Address Lookup: select → populate → save immediately (no Save / Cancel).
 */
export function BusinessAddressForm({
  register,
  errors,
  isSubmitting,
  isDefault,
  setValue,
  extras,
  onExtrasChange,
  vatRegistered,
  onVatRegisteredChange,
  lookupPostcode,
  onLookupPostcodeChange,
  lookupLoading,
  lookupResults,
  lookupSelected,
  onSearch,
  onSelectLookup,
  watchedLine1,
  watchedLine2,
  watchedCity,
  watchedPostcode,
  onSubmit,
}: BusinessAddressFormProps) {
  return (
    <form className="addresses-v1-form" onSubmit={onSubmit} noValidate data-addresses-form="business">
      <input type="hidden" {...register("addressType")} />
      <input type="hidden" {...register("country")} value={UK_DEFAULT_COUNTRY} />
      <input type="hidden" {...register("addressLine")} />
      <input type="hidden" {...register("addressLine2")} />
      <input type="hidden" {...register("city")} />
      <input type="hidden" {...register("postcode")} />

      <CanonicalInput
        id="businessName"
        label="Business Name"
        error={errors.recipientName?.message}
        {...register("recipientName")}
      />

      <p className="addresses-v1-form__label">Country</p>
      <p className="addresses-v1-form__value">{UK_DEFAULT_COUNTRY}</p>

      <p className="addresses-v1-form__label">Address Lookup</p>
      <CanonicalInput
        id="businessLookupPostcode"
        label="Postcode"
        value={lookupPostcode}
        onChange={(event) => onLookupPostcodeChange(event.target.value)}
        disabled={isSubmitting}
      />
      <CanonicalButton
        type="button"
        fullWidth
        loading={lookupLoading}
        disabled={isSubmitting}
        onClick={onSearch}
      >
        {lookupLoading ? "Searching…" : "Search Address"}
      </CanonicalButton>

      {lookupResults.length ? (
        <ul
          className="addresses-v1-lookup-results"
          role="listbox"
          aria-label="Select Address"
          aria-busy={isSubmitting || undefined}
        >
          {lookupResults.map((result) => {
            const selected =
              lookupSelected &&
              watchedLine1 === result.line1 &&
              watchedPostcode === result.postcode;
            return (
              <li key={result.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={isSubmitting}
                  className={cn(
                    "addresses-v1-lookup-result",
                    selected && "addresses-v1-lookup-result--selected",
                  )}
                  onClick={() => onSelectLookup(result)}
                >
                  {isSubmitting && selected ? "Saving…" : result.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {lookupSelected ? (
        <>
          <p className="addresses-v1-form__label">Address line 1</p>
          <p className="addresses-v1-form__value">{watchedLine1}</p>
          {watchedLine2 ? (
            <>
              <p className="addresses-v1-form__label">Address line 2</p>
              <p className="addresses-v1-form__value">{watchedLine2}</p>
            </>
          ) : null}
          <p className="addresses-v1-form__label">City</p>
          <p className="addresses-v1-form__value">{watchedCity}</p>
          <p className="addresses-v1-form__label">Postcode</p>
          <p className="addresses-v1-form__value">{watchedPostcode}</p>
        </>
      ) : null}

      <CanonicalInput
        id="businessCounty"
        label="County (optional)"
        value={extras.county}
        onChange={(event) => onExtrasChange({ county: event.target.value })}
        disabled={isSubmitting}
      />
      <CanonicalInput
        id="businessPhone"
        label="Phone number"
        inputType="phone"
        value={extras.phone}
        onChange={(event) => onExtrasChange({ phone: event.target.value })}
        autoComplete="tel"
        disabled={isSubmitting}
      />

      <CanonicalSwitch
        id="vatRegistered"
        label="VAT Registered"
        checked={vatRegistered}
        onChange={onVatRegisteredChange}
        disabled={isSubmitting}
      />

      <CanonicalSwitch
        id="isDefaultBusiness"
        label="Set as default business"
        checked={Boolean(isDefault)}
        onChange={(checked) => setValue("isDefault", checked, { shouldDirty: true })}
        disabled={isSubmitting}
      />

      <p className="sr-only" aria-live="polite">
        {isSubmitting ? "Saving address…" : null}
      </p>
    </form>
  );
}

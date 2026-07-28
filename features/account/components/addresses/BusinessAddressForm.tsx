"use client";

import type { FormEventHandler } from "react";
import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import {
  CanonicalButton,
  CanonicalInput,
  CanonicalSwitch,
} from "@/src/components/canonical";
import { UK_DEFAULT_COUNTRY } from "@/lib/i18n/uk-first";
import { MY_ACCOUNT_PRIMARY_BUTTON_DOM } from "@/lib/design-system/my-account-primary-button-v1";
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
  onSubmit: FormEventHandler<HTMLFormElement>;
  onCancel: () => void;
  onDelete?: () => void;
};

/**
 * Business Add / Edit Address form (Owner contract fields).
 */
export function BusinessAddressForm({
  register,
  errors,
  isSubmitting,
  isEditing,
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
  onCancel,
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
      />
      <CanonicalButton type="button" fullWidth loading={lookupLoading} onClick={onSearch}>
        {lookupLoading ? "Searching…" : "Search Address"}
      </CanonicalButton>

      {lookupResults.length ? (
        <ul className="addresses-v1-lookup-results" role="listbox" aria-label="Select Address">
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
                  className={cn(
                    "addresses-v1-lookup-result",
                    selected && "addresses-v1-lookup-result--selected",
                  )}
                  onClick={() => onSelectLookup(result)}
                >
                  {result.label}
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
      />
      <CanonicalInput
        id="businessPhone"
        label="Phone number"
        inputType="phone"
        value={extras.phone}
        onChange={(event) => onExtrasChange({ phone: event.target.value })}
        autoComplete="tel"
      />

      <CanonicalSwitch
        id="vatRegistered"
        label="VAT Registered"
        checked={vatRegistered}
        onChange={onVatRegisteredChange}
      />

      <CanonicalSwitch
        id="isDefaultBusiness"
        label="Set as default business"
        checked={Boolean(isDefault)}
        onChange={(checked) => setValue("isDefault", checked, { shouldDirty: true })}
      />

      <div className="addresses-v1-form__actions">
        <CanonicalButton
          type="submit"
          fullWidth
          loading={isSubmitting}
          data-my-account-primary={MY_ACCOUNT_PRIMARY_BUTTON_DOM}
        >
          {isSubmitting ? "Saving…" : isEditing ? "Save Changes" : "Save Address"}
        </CanonicalButton>
        <CanonicalButton type="button" variant="ghost" fullWidth onClick={onCancel}>
          Cancel
        </CanonicalButton>
      </div>
    </form>
  );
}

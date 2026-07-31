"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MyAccountTemplate, AccountPageStack } from "@/features/account-canonical";
import { CanonicalButton, CanonicalInfoBlock } from "@/src/components/canonical";
import { readReturnToParam } from "@/lib/navigation/return-to";
import { addressInputSchema, type AddressInput } from "@/lib/account/schemas";
import { UK_DEFAULT_COUNTRY } from "@/lib/i18n/uk-first";
import type { UserAddress } from "@/lib/addresses/repository";
import {
  ADDRESS_SCOPE_TO_STORAGE,
  addCtaLabelForScope,
  ADDRESSES_UI_VERSION,
  type AddressStorageType,
  type AddressUiScope,
} from "@/lib/addresses/canonical";
import { ADDRESSES_MASTER_LOCK_DOM } from "@/lib/addresses/freeze";
import { ADDRESS_ENGINE_DOM } from "@/lib/addresses/address-engine-v1";
import { MY_ACCOUNT_PRIMARY_BUTTON_DOM } from "@/lib/design-system/my-account-primary-button-v1";
import { resolveBusinessAddressesVisibility } from "@/lib/master-engine";
import { AddressesTabs } from "@/features/account/components/addresses/AddressesTabs";
import { PersonalAddresses } from "@/features/account/components/addresses/PersonalAddresses";
import { BusinessAddresses } from "@/features/account/components/addresses/BusinessAddresses";
import { AddressForm, type AddressFormExtras } from "@/features/account/components/addresses/AddressForm";
import { BusinessAddressForm } from "@/features/account/components/addresses/BusinessAddressForm";
import { EditAddress } from "@/features/account/components/addresses/EditAddress";
import type {
  AddressesPageProps,
  UkLookupResult,
} from "@/features/account/components/addresses/types";
import "@/styles/rovexo/addresses-v1.css";

const EMPTY_EXTRAS: AddressFormExtras = { county: "", phone: "" };

/**
 * Addresses v1.0 — Profile design system + Owner mockup. Fully functional.
 */
export function AddressesPage({
  initialScope = "personal",
  businessProfile = null,
}: AddressesPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = readReturnToParam(searchParams);
  const showBusinessTab = resolveBusinessAddressesVisibility().showBusinessAddressesTab;
  const safeInitialScope: AddressUiScope =
    showBusinessTab && initialScope === "business" ? "business" : "personal";

  const [activeScope, setActiveScope] = useState<AddressUiScope>(safeInitialScope);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [lookupSelected, setLookupSelected] = useState(false);
  const [lookupResults, setLookupResults] = useState<UkLookupResult[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupPostcode, setLookupPostcode] = useState("");
  const [editSheetAddress, setEditSheetAddress] = useState<UserAddress | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [extras, setExtras] = useState<AddressFormExtras>(EMPTY_EXTRAS);
  const [vatRegisteredDraft, setVatRegisteredDraft] = useState(
    Boolean(businessProfile?.vatRegistered),
  );

  const activeType: AddressStorageType = ADDRESS_SCOPE_TO_STORAGE[activeScope];

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressInputSchema),
    defaultValues: {
      recipientName: "",
      addressLine: "",
      addressLine2: "",
      city: "",
      postcode: "",
      country: UK_DEFAULT_COUNTRY,
      addressType: activeType,
      isDefault: false,
    },
  });

  const loadAddresses = async (scope: AddressUiScope) => {
    const type = ADDRESS_SCOPE_TO_STORAGE[scope];
    try {
      const response = await fetch(`/api/addresses?type=${type}`, {
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) {
        setMessage("Unable to load addresses.");
        setAddresses([]);
        return;
      }
      const payload = (await response.json()) as { addresses: UserAddress[] };
      setAddresses(payload.addresses ?? []);
    } catch {
      setMessage("Unable to load addresses.");
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = (scope: AddressUiScope) => {
    const type = ADDRESS_SCOPE_TO_STORAGE[scope];
    const defaultName =
      scope === "business" ? (businessProfile?.businessName ?? "").trim() : "";
    reset({
      recipientName: defaultName,
      addressLine: "",
      addressLine2: "",
      city: "",
      postcode: "",
      country: UK_DEFAULT_COUNTRY,
      addressType: type,
      isDefault: false,
    });
    setLookupSelected(false);
    setLookupResults([]);
    setLookupPostcode("");
    setExtras(EMPTY_EXTRAS);
    setVatRegisteredDraft(Boolean(businessProfile?.vatRegistered));
  };

  const switchScope = (scope: AddressUiScope) => {
    setActiveScope(scope);
    setLoading(true);
    setEditingId(null);
    setShowForm(false);
    setEditSheetAddress(null);
    setMessage(null);
    resetForm(scope);
    void loadAddresses(scope);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const type = ADDRESS_SCOPE_TO_STORAGE[initialScope];
        const response = await fetch(`/api/addresses?type=${type}`, {
          signal: AbortSignal.timeout(12_000),
        });
        const payload = (await response.json()) as { addresses: UserAddress[] };
        if (cancelled) return;
        setAddresses(payload.addresses ?? []);
      } catch {
        if (!cancelled) {
          setAddresses([]);
          setMessage("Unable to load addresses.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialScope]);

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    if (!lookupSelected) {
      setMessage("Search and select an address before saving.");
      return;
    }
    const response = await fetch(editingId ? `/api/addresses/${editingId}` : "/api/addresses", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        country: UK_DEFAULT_COUNTRY,
        addressType: activeType,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to save address.");
      return;
    }
    setEditingId(null);
    setShowForm(false);
    resetForm(activeScope);
    await loadAddresses(activeScope);
    if (returnTo) {
      router.push(returnTo);
      return;
    }
    setMessage("Address saved.");
  });

  const openEditSheet = (address: UserAddress) => {
    setEditSheetAddress(address);
  };

  const closeEditSheet = () => {
    setEditSheetAddress(null);
  };

  const startEditFromSheet = () => {
    if (!editSheetAddress) return;
    const address = editSheetAddress;
    setEditingId(address.id);
    setShowForm(true);
    setLookupSelected(true);
    setLookupPostcode(address.postcode);
    reset({
      recipientName: address.recipientName,
      addressLine: address.addressLine,
      addressLine2: address.addressLine2 ?? "",
      city: address.city ?? "",
      postcode: address.postcode,
      country: UK_DEFAULT_COUNTRY,
      addressType: address.addressType,
      isDefault: address.isDefault,
    });
    setExtras(EMPTY_EXTRAS);
    setVatRegisteredDraft(Boolean(businessProfile?.vatRegistered));
    closeEditSheet();
  };

  const setDefaultFromSheet = async () => {
    if (!editSheetAddress) return;
    setMessage(null);
    const response = await fetch(`/api/addresses/${editSheetAddress.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_default" }),
    });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setMessage(payload.error ?? "Unable to set default address.");
      return;
    }
    closeEditSheet();
    await loadAddresses(activeScope);
    setMessage("Default address updated.");
  };

  const startAdd = () => {
    setEditingId(null);
    setShowForm(true);
    resetForm(activeScope);
  };

  const cancelForm = () => {
    setEditingId(null);
    setShowForm(false);
    resetForm(activeScope);
  };

  const removeAddress = async (id: string) => {
    setMessage(null);
    const response = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setMessage(payload.error ?? "Unable to delete address.");
      return;
    }
    if (editingId === id) cancelForm();
    closeEditSheet();
    await loadAddresses(activeScope);
    setMessage("Address deleted.");
  };

  const searchAddress = async () => {
    setMessage(null);
    setLookupLoading(true);
    setLookupResults([]);
    setLookupSelected(false);
    try {
      const response = await fetch(
        `/api/addresses/lookup?postcode=${encodeURIComponent(lookupPostcode.trim())}`,
      );
      const payload = (await response.json()) as {
        addresses?: UkLookupResult[];
        error?: string;
      };
      if (!response.ok) {
        setMessage(payload.error ?? "Address lookup temporarily unavailable.");
        return;
      }
      const results = payload.addresses ?? [];
      setLookupResults(results);
      if (!results.length) {
        setMessage("No addresses found for that postcode.");
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const selectLookupAddress = (result: UkLookupResult) => {
    setValue("addressLine", result.line1, { shouldDirty: true });
    setValue("addressLine2", result.line2, { shouldDirty: true });
    setValue("city", result.city, { shouldDirty: true });
    setValue("postcode", result.postcode, { shouldDirty: true });
    setValue("country", UK_DEFAULT_COUNTRY, { shouldDirty: true });
    setExtras((prev) => ({ ...prev, county: result.county?.trim() ?? "" }));
    setLookupSelected(true);
    setLookupPostcode(result.postcode);
    setMessage(null);
  };

  const isDefault = useWatch({ control, name: "isDefault" });
  const watchedLine1 = useWatch({ control, name: "addressLine" });
  const watchedLine2 = useWatch({ control, name: "addressLine2" });
  const watchedCity = useWatch({ control, name: "city" });
  const watchedPostcode = useWatch({ control, name: "postcode" });

  const formShared = {
    register,
    errors,
    isSubmitting,
    isEditing: Boolean(editingId),
    isDefault: Boolean(isDefault),
    setValue,
    extras,
    onExtrasChange: (patch: Partial<AddressFormExtras>) =>
      setExtras((prev) => ({ ...prev, ...patch })),
    lookupPostcode,
    onLookupPostcodeChange: (value: string) => {
      setLookupPostcode(value);
      setLookupSelected(false);
    },
    lookupLoading,
    lookupResults,
    lookupSelected,
    onSearch: () => void searchAddress(),
    onSelectLookup: selectLookupAddress,
    watchedLine1,
    watchedLine2,
    watchedCity,
    watchedPostcode,
    onSubmit,
    onCancel: cancelForm,
    onDelete: editingId ? () => void removeAddress(editingId) : undefined,
  };

  return (
    <MyAccountTemplate surface="addresses" title="Addresses" backHref="/account/settings">
      <div
        className="addresses-v1"
        data-addresses-ui={ADDRESSES_UI_VERSION}
        data-addresses-master-lock={ADDRESSES_MASTER_LOCK_DOM}
        data-address-engine={ADDRESS_ENGINE_DOM}
        data-profile-inherit="100"
        data-addresses-page="v1.0"
      >
        <AccountPageStack className="addresses-v1__stack">
          {!showForm ? <AddressesTabs activeScope={activeScope} onChange={switchScope} /> : null}

          {!showForm ? (
            <>
              {activeScope === "personal" ? (
                <PersonalAddresses
                  addresses={addresses}
                  loading={loading}
                  onEdit={openEditSheet}
                />
              ) : (
                <BusinessAddresses
                  addresses={addresses}
                  loading={loading}
                  businessProfile={businessProfile}
                  onEdit={openEditSheet}
                />
              )}

              <div className="addresses-v1__cta">
                <CanonicalButton
                  type="button"
                  fullWidth
                  onClick={startAdd}
                  data-my-account-primary={MY_ACCOUNT_PRIMARY_BUTTON_DOM}
                  data-addresses-cta={
                    activeScope === "business" ? "add-business" : "add-personal"
                  }
                >
                  {addCtaLabelForScope(activeScope)}
                </CanonicalButton>
              </div>
            </>
          ) : activeScope === "business" ? (
            <BusinessAddressForm
              {...formShared}
              vatRegistered={vatRegisteredDraft}
              onVatRegisteredChange={setVatRegisteredDraft}
            />
          ) : (
            <AddressForm {...formShared} />
          )}

          {message ? <CanonicalInfoBlock variant="description">{message}</CanonicalInfoBlock> : null}
        </AccountPageStack>
      </div>

      {editSheetAddress ? (
        <EditAddress
          address={editSheetAddress}
          onEdit={startEditFromSheet}
          onSetDefault={() => void setDefaultFromSheet()}
          onDelete={() => void removeAddress(editSheetAddress.id)}
          onCancel={closeEditSheet}
        />
      ) : null}
    </MyAccountTemplate>
  );
}

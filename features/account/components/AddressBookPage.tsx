"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AccountCanonicalShell, AccountPageStack } from "@/features/account-canonical";
import {
  CanonicalButton,
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalInput,
  CanonicalSection,
  CanonicalSelector,
  CanonicalSwitch,
} from "@/src/components/canonical";
import { readReturnToParam } from "@/lib/navigation/return-to";
import { addressInputSchema, type AddressInput } from "@/lib/account/schemas";
import { UK_DEFAULT_COUNTRY } from "@/lib/i18n/uk-first";
import { SUPPORTED_COUNTRIES } from "@/lib/account/countries";
import type { UserAddress } from "@/lib/addresses/repository";
import { cn } from "@/lib/cn";

type AddressBookPageProps = {
  initialType?: "shipping" | "billing";
};

function formatAddressLines(address: UserAddress): string {
  const lines = [
    address.addressLine,
    address.addressLine2,
    [address.city, address.postcode, address.country].filter(Boolean).join(", "),
  ].filter(Boolean);
  return lines.join("\n");
}

export function AddressBookPage({ initialType = "shipping" }: AddressBookPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = readReturnToParam(searchParams);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<"shipping" | "billing">(initialType);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  const loadAddresses = async (type: "shipping" | "billing") => {
    const response = await fetch(`/api/addresses?type=${type}`);
    if (!response.ok) {
      setMessage("Unable to load addresses.");
      setLoading(false);
      return;
    }
    const payload = (await response.json()) as { addresses: UserAddress[] };
    setAddresses(payload.addresses ?? []);
    setLoading(false);
  };

  const resetForm = (type: "shipping" | "billing") => {
    reset({
      recipientName: "",
      addressLine: "",
      addressLine2: "",
      city: "",
      postcode: "",
      country: UK_DEFAULT_COUNTRY,
      addressType: type,
      isDefault: false,
    });
  };

  const switchType = (type: "shipping" | "billing") => {
    setActiveType(type);
    setLoading(true);
    setEditingId(null);
    setShowForm(false);
    resetForm(type);
    void loadAddresses(type);
  };

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const response = await fetch(`/api/addresses?type=${initialType}`);
      const payload = (await response.json()) as { addresses: UserAddress[] };
      if (cancelled) return;
      setAddresses(payload.addresses ?? []);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [initialType]);

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    const response = await fetch(editingId ? `/api/addresses/${editingId}` : "/api/addresses", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, addressType: activeType }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to save address.");
      return;
    }
    setEditingId(null);
    setShowForm(false);
    resetForm(activeType);
    await loadAddresses(activeType);
    if (returnTo) {
      router.push(returnTo);
      return;
    }
    setMessage("Address saved.");
  });

  const startEdit = (address: UserAddress) => {
    setEditingId(address.id);
    setShowForm(true);
    reset({
      recipientName: address.recipientName,
      addressLine: address.addressLine,
      addressLine2: address.addressLine2 ?? "",
      city: address.city ?? "",
      postcode: address.postcode,
      country: address.country,
      addressType: address.addressType,
      isDefault: address.isDefault,
    });
  };

  const startAdd = () => {
    setEditingId(null);
    setShowForm(true);
    resetForm(activeType);
  };

  const cancelForm = () => {
    setEditingId(null);
    setShowForm(false);
    resetForm(activeType);
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
    await loadAddresses(activeType);
    setMessage("Address deleted.");
  };

  const isDefault = useWatch({ control, name: "isDefault" });

  return (
    <AccountCanonicalShell title="Addresses" backHref="/account/settings">
      <AccountPageStack>
        <CanonicalSection title="Address Type">
          <div className="account-settings-segment" role="tablist" aria-label="Address type">
            <button
              type="button"
              role="tab"
              aria-selected={activeType === "shipping"}
              className={cn(
                "account-settings-segment__option",
                activeType === "shipping" && "account-settings-segment__option--active",
              )}
              onClick={() => switchType("shipping")}
            >
              Personal
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeType === "billing"}
              className={cn(
                "account-settings-segment__option",
                activeType === "billing" && "account-settings-segment__option--active",
              )}
              onClick={() => switchType("billing")}
            >
              Business
            </button>
          </div>
        </CanonicalSection>

        <CanonicalSection title="Saved Addresses">
          {loading ? <p className="account-settings-empty">Loading addresses…</p> : null}
          {!loading && !addresses.length ? (
            <p className="account-settings-empty">No saved addresses yet.</p>
          ) : null}
          {!loading
            ? addresses.map((address) => (
                <CanonicalCard key={address.id} variant="medium">
                  <div className="account-settings-address-card">
                    <div className="account-settings-address-card__header">
                      <div>
                        <p className="account-settings-address-card__name">{address.recipientName}</p>
                        <p className="account-settings-address-card__address whitespace-pre-line">
                          {formatAddressLines(address)}
                        </p>
                      </div>
                      {address.isDefault ? (
                        <span className="account-settings-address-card__badge">Default</span>
                      ) : null}
                    </div>
                    <div className="account-settings-address-card__actions">
                      <button
                        type="button"
                        className="account-settings-text-action"
                        onClick={() => startEdit(address)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="account-settings-text-action account-settings-text-action--danger"
                        onClick={() => void removeAddress(address.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </CanonicalCard>
              ))
            : null}
        </CanonicalSection>

        {showForm ? (
          <CanonicalSection title={editingId ? "Edit Address" : "Add Address"}>
            <CanonicalCard variant="medium" className="flex flex-col gap-ds-4 p-ds-4">
              <form onSubmit={onSubmit} className="flex flex-col gap-ds-4" noValidate>
                <input type="hidden" {...register("addressType")} value={activeType} />
                <CanonicalInput
                  id="recipientName"
                  label="Name"
                  error={errors.recipientName?.message}
                  {...register("recipientName")}
                />
                <CanonicalInput
                  id="addressLine"
                  label="Address"
                  error={errors.addressLine?.message}
                  {...register("addressLine")}
                />
                <CanonicalInput id="addressLine2" label="Address line 2" {...register("addressLine2")} />
                <div className="grid gap-ds-3 sm:grid-cols-2">
                  <CanonicalInput id="city" label="City" {...register("city")} />
                  <CanonicalInput
                    id="postcode"
                    label="Postcode"
                    error={errors.postcode?.message}
                    {...register("postcode")}
                  />
                </div>
                <CanonicalSelector
                  id="country"
                  label="Country"
                  kind="country"
                  options={SUPPORTED_COUNTRIES.map((country) => ({
                    value: country.name,
                    label: country.name,
                  }))}
                  error={errors.country?.message}
                  {...register("country")}
                />
                <CanonicalSwitch
                  id="isDefault"
                  label="Default address"
                  checked={Boolean(isDefault)}
                  onChange={(checked) => setValue("isDefault", checked, { shouldDirty: true })}
                />
                <CanonicalButton type="submit" fullWidth loading={isSubmitting}>
                  {isSubmitting ? "Saving…" : "Save Address"}
                </CanonicalButton>
                <CanonicalButton type="button" variant="ghost" fullWidth onClick={cancelForm}>
                  Cancel
                </CanonicalButton>
              </form>
            </CanonicalCard>
          </CanonicalSection>
        ) : (
          <CanonicalButton type="button" fullWidth onClick={startAdd}>
            Add Address
          </CanonicalButton>
        )}

        {message ? <CanonicalInfoBlock variant="description">{message}</CanonicalInfoBlock> : null}
      </AccountPageStack>
    </AccountCanonicalShell>
  );
}

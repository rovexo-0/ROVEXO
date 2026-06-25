"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { addressInputSchema, type AddressInput } from "@/lib/account/schemas";
import type { UserAddress } from "@/lib/addresses/repository";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type AddressBookPageProps = {
  initialType?: "shipping" | "billing";
};

const inputClassName = cn(
  "w-full rounded-ds-lg border border-border bg-surface px-ds-3 py-ds-3 text-sm text-text-primary",
  focusRing,
);

export function AddressBookPage({ initialType = "shipping" }: AddressBookPageProps) {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<"shipping" | "billing">(initialType);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressInputSchema),
    defaultValues: {
      recipientName: "",
      addressLine: "",
      addressLine2: "",
      city: "",
      postcode: "",
      country: "Ireland",
      addressType: activeType,
      isDefault: false,
    },
  });

  const loadAddresses = async (type: "shipping" | "billing") => {
    const response = await fetch(`/api/addresses?type=${type}`);
    const payload = (await response.json()) as { addresses: UserAddress[] };
    setAddresses(payload.addresses ?? []);
    setLoading(false);
  };

  const switchType = (type: "shipping" | "billing") => {
    setActiveType(type);
    setLoading(true);
    setEditingId(null);
    reset({
      recipientName: "",
      addressLine: "",
      addressLine2: "",
      city: "",
      postcode: "",
      country: "Ireland",
      addressType: type,
      isDefault: false,
    });
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
    reset({
      recipientName: "",
      addressLine: "",
      addressLine2: "",
      city: "",
      postcode: "",
      country: "Ireland",
      addressType: activeType,
      isDefault: false,
    });
    await loadAddresses(activeType);
    setMessage("Address saved.");
  });

  const startEdit = (address: UserAddress) => {
    setEditingId(address.id);
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

  const removeAddress = async (id: string) => {
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    await loadAddresses(activeType);
  };

  const makeDefault = async (id: string) => {
    await fetch(`/api/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_default" }),
    });
    await loadAddresses(activeType);
  };

  return (
    <BetaAppShell showBottomNav={false}>
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-6 px-ds-4 py-ds-6 pb-[calc(var(--ds-space-8)+env(safe-area-inset-bottom))]">
        <div>
          <Link href="/account" className="text-sm font-medium text-primary hover:underline">
            ← Account
          </Link>
          <h1 className="mt-ds-3 text-2xl font-bold text-text-primary">Address book</h1>
          <p className="mt-ds-1 text-sm text-text-secondary">
            Manage shipping and billing addresses for checkout and invoices.
          </p>
        </div>

        <div className="flex gap-ds-2">
          {(["shipping", "billing"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => switchType(type)}
              className={cn(
                "rounded-ds-full px-ds-4 py-ds-2 text-sm font-medium capitalize",
                activeType === type ? "bg-primary text-primary-foreground" : "bg-surface-muted text-text-secondary",
                focusRing,
              )}
            >
              {type}
            </button>
          ))}
        </div>

        <section className="flex flex-col gap-ds-3">
          {loading ? <p className="text-sm text-text-secondary">Loading addresses…</p> : null}
          {!loading && !addresses.length ? (
            <p className="text-sm text-text-secondary">No {activeType} addresses yet.</p>
          ) : null}
          {addresses.map((address) => (
            <article key={address.id} className="premium-card p-ds-4">
              <div className="flex items-start justify-between gap-ds-3">
                <div>
                  <p className="font-semibold text-text-primary">{address.recipientName}</p>
                  <p className="mt-ds-1 text-sm text-text-secondary">
                    {address.addressLine}
                    {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {[address.city, address.postcode, address.country].filter(Boolean).join(", ")}
                  </p>
                </div>
                {address.isDefault ? <Badge>Default</Badge> : null}
              </div>
              <div className="mt-ds-3 flex flex-wrap gap-ds-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(address)}>
                  Edit
                </Button>
                {!address.isDefault ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => void makeDefault(address.id)}>
                    Make default
                  </Button>
                ) : null}
                <Button type="button" variant="ghost" size="sm" onClick={() => void removeAddress(address.id)}>
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </section>

        <form onSubmit={onSubmit} className="premium-card flex flex-col gap-ds-3 p-ds-5" noValidate>
          <h2 className="text-base font-semibold text-text-primary">
            {editingId ? "Edit address" : `Add ${activeType} address`}
          </h2>
          <input type="hidden" {...register("addressType")} value={activeType} />
          <div>
            <label htmlFor="recipientName" className="text-sm font-medium">Recipient name</label>
            <input id="recipientName" className={cn(inputClassName, "mt-ds-1")} {...register("recipientName")} />
            {errors.recipientName ? <p className="text-xs text-danger">{errors.recipientName.message}</p> : null}
          </div>
          <div>
            <label htmlFor="addressLine" className="text-sm font-medium">Address line</label>
            <input id="addressLine" className={cn(inputClassName, "mt-ds-1")} {...register("addressLine")} />
            {errors.addressLine ? <p className="text-xs text-danger">{errors.addressLine.message}</p> : null}
          </div>
          <div>
            <label htmlFor="addressLine2" className="text-sm font-medium">Address line 2</label>
            <input id="addressLine2" className={cn(inputClassName, "mt-ds-1")} {...register("addressLine2")} />
          </div>
          <div className="grid gap-ds-3 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className="text-sm font-medium">City</label>
              <input id="city" className={cn(inputClassName, "mt-ds-1")} {...register("city")} />
            </div>
            <div>
              <label htmlFor="postcode" className="text-sm font-medium">Postcode</label>
              <input id="postcode" className={cn(inputClassName, "mt-ds-1")} {...register("postcode")} />
              {errors.postcode ? <p className="text-xs text-danger">{errors.postcode.message}</p> : null}
            </div>
          </div>
          <div>
            <label htmlFor="country" className="text-sm font-medium">Country</label>
            <input id="country" className={cn(inputClassName, "mt-ds-1")} {...register("country")} />
            {errors.country ? <p className="text-xs text-danger">{errors.country.message}</p> : null}
          </div>
          <label className="flex items-center gap-ds-2 text-sm text-text-primary">
            <input type="checkbox" {...register("isDefault")} />
            Set as default {activeType} address
          </label>
          <div className="flex gap-ds-2">
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save address"}
            </Button>
            {editingId ? (
              <Button type="button" variant="ghost" onClick={() => setEditingId(null)}>
                Cancel edit
              </Button>
            ) : null}
          </div>
          {message ? <p className="text-sm text-text-secondary">{message}</p> : null}
        </form>
      </main>
    </BetaAppShell>
  );
}

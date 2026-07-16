"use client";

import { useCallback, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { ParcelCard } from "@/features/shipping/components/ParcelCard";
import { ShipmentSummary } from "@/features/shipping/components/ShipmentSummary";
import { OrderProductCard } from "@/features/orders/components/OrderProductCard";
import type { Order } from "@/lib/orders/types";
import type { ShipmentParcel, ShippingRecord } from "@/lib/shipping/types";

type ShipmentWizardProps = {
  order: Order;
  userId: string;
  initialRecord: ShippingRecord | null;
  initialParcels: ShipmentParcel[];
};

type WizardStep = "review" | "parcels";

export function ShipmentWizard({
  order,
  userId,
  initialRecord,
  initialParcels,
}: ShipmentWizardProps) {
  const [step, setStep] = useState<WizardStep>("review");
  const [record, setRecord] = useState(initialRecord);
  const [parcels, setParcels] = useState(initialParcels);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPrepare =
    order.status === "awaiting_shipment" || order.status === "shipped";

  const stepLabel = useMemo(
    () => ({
      review: "Review Order",
      parcels: "Create Parcels",
    }),
    [],
  );

  const refreshShipment = useCallback(async () => {
    const response = await fetch(`/api/orders/${order.id}/shipment`);
    if (!response.ok) return;
    const payload = (await response.json()) as {
      shipment?: { record: ShippingRecord | null; parcels: ShipmentParcel[] };
    };
    if (payload.shipment) {
      setRecord(payload.shipment.record);
      setParcels(payload.shipment.parcels);
    }
  }, [order.id]);

  const addParcel = useCallback(async () => {
    setIsAdding(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${order.id}/shipment/parcels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productItemIds: [order.product.id],
          carrier: String(order.deliveryCarrier),
        }),
      });
      const payload = (await response.json()) as { parcels?: ShipmentParcel[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to add parcel.");
      }
      setParcels(payload.parcels ?? []);
      setStep("parcels");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add parcel.");
    } finally {
      setIsAdding(false);
    }
  }, [order.deliveryCarrier, order.id, order.product.id]);

  const removeParcel = useCallback(
    async (parcelId: string) => {
      setError(null);
      const response = await fetch(`/api/orders/${order.id}/shipment/parcels/${parcelId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { parcels?: ShipmentParcel[]; error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Unable to remove parcel.");
        return;
      }
      setParcels(payload.parcels ?? []);
    },
    [order.id],
  );

  if (!canPrepare) {
    return (
      <div className="flex flex-col gap-ds-5">
        <Card padding="lg" className="flex min-h-16 items-center justify-between gap-ds-3">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Shipment complete</h2>
            <p className="mt-ds-1 text-xs text-text-secondary">
              Delivery details remain available for this order.
            </p>
          </div>
          <span className="rounded-full bg-success/10 px-ds-3 py-ds-2 text-xs font-semibold text-success">
            Delivered
          </span>
        </Card>
        <OrderProductCard order={order} userId={userId} />
        <ShipmentSummary record={record} parcels={parcels} />
        <div className="flex min-h-12 items-center justify-center rounded-ds-lg bg-success/10 text-sm font-semibold text-success">
          Delivered
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-ds-5">
      <Card padding="lg" className="flex flex-col gap-ds-4">
        <div className="flex items-center gap-ds-2">
          {(["review", "parcels"] as WizardStep[]).map((wizardStep, index) => {
            const active = step === wizardStep;
            const done = wizardStep === "review" && step === "parcels";
            return (
              <button
                key={wizardStep}
                type="button"
                onClick={() => setStep(wizardStep)}
                className={cn(
                  "flex flex-1 items-center gap-ds-2 rounded-ds-md px-ds-3 py-ds-2 text-left text-sm",
                  active ? "bg-primary/10 text-primary" : "bg-surface-muted text-text-secondary",
                  focusRing,
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    active || done ? "bg-primary text-on-primary" : "bg-surface text-text-muted",
                  )}
                >
                  {index + 1}
                </span>
                <span className="font-medium">{stepLabel[wizardStep]}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {step === "review" ? (
        <>
          <OrderProductCard order={order} userId={userId} />
          <ShipmentSummary record={record} parcels={parcels} />
          <Button variant="primary" fullWidth onClick={() => setStep("parcels")}>
            Continue to Parcels
          </Button>
        </>
      ) : (
        <>
          <ShipmentSummary record={record} parcels={parcels} />
          <div className="flex flex-col gap-ds-4">
            {parcels.map((parcel) => (
              <ParcelCard
                key={parcel.id}
                order={order}
                parcel={parcel}
                onUpdated={(updated) => {
                  setParcels((current) =>
                    current.map((item) => (item.id === updated.id ? updated : item)),
                  );
                  void refreshShipment();
                }}
                onDeleted={(parcelId) => void removeParcel(parcelId)}
              />
            ))}
          </div>

          <Button
            variant="outline"
            fullWidth
            disabled={isAdding}
            onClick={() => void addParcel()}
          >
            <Plus className="mr-ds-2 h-4 w-4" aria-hidden />
            {isAdding ? "Adding Parcel…" : "Add Parcel"}
          </Button>

          {parcels.length === 0 ? (
            <p className="text-sm text-text-secondary">
              Add at least one parcel before generating labels.
            </p>
          ) : null}
        </>
      )}

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

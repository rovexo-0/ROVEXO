import type { DeliveryCarrier } from "@/lib/products/types";

type ProductDeliveryProps = {
  carriers: DeliveryCarrier[];
};

export function ProductDelivery({ carriers }: ProductDeliveryProps) {
  return (
    <section aria-labelledby="delivery-heading">
      <h2 id="delivery-heading" className="mb-ds-3 text-base font-semibold text-text-primary">
        Available Delivery
      </h2>

      <ul className="flex flex-wrap gap-ds-2">
        {carriers.map((carrier) => (
          <li key={carrier}>
            <span className="inline-flex items-center rounded-ds-full border border-border bg-surface-muted px-ds-4 py-ds-2 text-xs font-semibold text-text-primary shadow-ds-soft">
              {carrier}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

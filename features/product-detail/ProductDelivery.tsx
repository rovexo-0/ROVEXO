import type { DeliveryCarrier } from "@/lib/products/types";

type ProductDeliveryProps = {
  carriers: DeliveryCarrier[];
  freeDelivery?: boolean;
};

export function ProductDelivery({ carriers, freeDelivery = false }: ProductDeliveryProps) {
  return (
    <section aria-labelledby="delivery-heading">
      <h2 id="delivery-heading" className="mb-ds-3 text-base font-semibold text-text-primary">
        Available Delivery
      </h2>

      {freeDelivery ? (
        <p className="mb-ds-3 inline-flex items-center rounded-ds-full bg-primary/10 px-ds-3 py-ds-1 text-xs font-semibold text-primary">
          Free delivery
        </p>
      ) : null}

      <ul className="flex flex-wrap gap-ds-2">
        {carriers.map((carrier) => (
          <li key={carrier}>
            <span className="rx-chip inline-flex items-center px-ds-4 py-ds-2 text-xs font-semibold text-text-primary">
              {carrier}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

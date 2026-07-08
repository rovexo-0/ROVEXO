import {
  resolveConditionCopy,
  resolveConditionLabel,
} from "@/lib/product-detail/format";

type ProductConditionCardProps = {
  condition: string;
};

export function ProductConditionCard({ condition }: ProductConditionCardProps) {
  if (!condition?.trim()) return null;

  return (
    <section className="pd-v1__card pd-v1__condition" aria-labelledby="pd-condition-title">
      <div className="pd-v1__condition-head">
        <h2 id="pd-condition-title" className="pd-v1__condition-title">
          Condition
        </h2>
        <span className="pd-v1__condition-value">{resolveConditionLabel(condition)}</span>
      </div>
      <p className="pd-v1__condition-copy">{resolveConditionCopy(condition)}</p>
    </section>
  );
}

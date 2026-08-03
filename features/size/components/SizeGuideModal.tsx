"use client";

import styles from "@/features/size/components/SizeSelector.module.css";
import type { SizeEngineKind } from "@/lib/size";

type SizeGuideModalProps = {
  open: boolean;
  kind: SizeEngineKind;
  onClose: () => void;
};

export function SizeGuideModal({ open, kind, onClose }: SizeGuideModalProps) {
  if (!open) return null;

  const clothing = kind === "clothing" || kind === "generic";
  const footwear = kind === "footwear";

  return (
    <div className={styles["size-engine-modal"]} role="presentation" onClick={onClose}>
      <div
        className={styles["size-engine-modal__sheet"]}
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-guide-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="size-guide-title" className={styles["size-engine-modal__title"]}>
          Size guide
        </h2>
        {clothing ? (
          <p style={{ margin: "0 0 12px", color: "#4b5563", fontSize: 14, lineHeight: 1.45 }}>
            Clothing sizes use UK and EU conversions. Pick the closest match, or use Custom size if
            your label differs (for example 4XL or 46 Tall).
          </p>
        ) : null}
        {footwear ? (
          <p style={{ margin: "0 0 12px", color: "#4b5563", fontSize: 14, lineHeight: 1.45 }}>
            Footwear sizes are listed in UK with EU equivalents. If you only know EU or US sizing,
            choose Custom size and enter the label from your shoes.
          </p>
        ) : null}
        {!clothing && !footwear ? (
          <p style={{ margin: "0 0 12px", color: "#4b5563", fontSize: 14, lineHeight: 1.45 }}>
            Choose a listed size when available, or enter a custom size exactly as shown on the
            product.
          </p>
        ) : null}
        <button
          type="button"
          className={`${styles["size-engine-modal__btn"]} ${styles["size-engine-modal__btn--primary"]}`}
          style={{ width: "100%" }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

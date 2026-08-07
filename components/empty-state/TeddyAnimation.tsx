import styles from "./teddy-empty-state.module.css";
import { TEDDY_EMPTY_STATE_V1 } from "@/lib/empty-state";

/**
 * Static Teddy illustration (v1.1). No animation props. No motion.
 */
export function TeddyAnimation() {
  return (
    <div className={styles.stage} data-teddy-static="v1.1">
      {/* eslint-disable-next-line @next/next/no-img-element -- isolated static empty-state PNG */}
      <img
        className={styles.bear}
        src={TEDDY_EMPTY_STATE_V1.assetSrc}
        alt=""
        width={729}
        height={682}
        decoding="async"
        draggable={false}
      />
    </div>
  );
}

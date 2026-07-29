"use client";

import { TeddyAnimation } from "@/components/empty-state/TeddyAnimation";
import styles from "./teddy-empty-state.module.css";

export type TeddyEmptyStateProps = {
  visible: boolean;
};

/**
 * ROVEXO Teddy Empty State Engine v1.1 — Static Premium Edition.
 * Visual layer only. Props: `visible` — nothing else.
 * Zero animation. Immediate unmount when not visible.
 */
export function TeddyEmptyState({ visible }: TeddyEmptyStateProps) {
  if (!visible) return null;

  return (
    <div className={styles.root} data-teddy-empty="v1.1-static" aria-hidden>
      <TeddyAnimation />
    </div>
  );
}

export default TeddyEmptyState;

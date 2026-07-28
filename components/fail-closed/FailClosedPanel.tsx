"use client";

/**
 * Canonical Fail Closed panel — Owner copy + Retry.
 * Never renders raw Error.message or internal details.
 */

import Link from "next/link";
import {
  FAIL_CLOSED_COPY,
  type FailClosedVariant,
} from "@/lib/fail-closed/constants";
import { toUserSafeFailClosedMessage } from "@/lib/fail-closed/sanitize";
import "@/styles/rovexo/fail-closed-v1.css";

export type FailClosedPanelProps = {
  variant?: FailClosedVariant;
  /** Ignored for user display — sanitized away. */
  error?: unknown;
  onRetry?: () => void;
  homeHref?: string;
  className?: string;
  /** Compact inline section (wallet/settings block) vs full soft page. */
  density?: "page" | "section";
};

export function FailClosedPanel({
  variant = "unavailable",
  error,
  onRetry,
  homeHref = "/",
  className,
  density = "section",
}: FailClosedPanelProps) {
  const message = toUserSafeFailClosedMessage(error, variant);

  return (
    <section
      className={`fail-closed-v1 fail-closed-v1--${density}${className ? ` ${className}` : ""}`}
      data-fail-closed="v1.0"
      role="status"
      aria-live="polite"
    >
      <h2 className="fail-closed-v1__title">{message.title}</h2>
      {message.body ? <p className="fail-closed-v1__body">{message.body}</p> : null}
      {message.hint ? <p className="fail-closed-v1__hint">{message.hint}</p> : null}
      <div className="fail-closed-v1__actions">
        {onRetry ? (
          <button type="button" className="fail-closed-v1__retry" onClick={onRetry}>
            {message.retryLabel || FAIL_CLOSED_COPY.retryLabel}
          </button>
        ) : (
          <Link href={homeHref} className="fail-closed-v1__retry">
            {FAIL_CLOSED_COPY.retryLabel}
          </Link>
        )}
        <Link href={homeHref} className="fail-closed-v1__home">
          Home
        </Link>
      </div>
    </section>
  );
}

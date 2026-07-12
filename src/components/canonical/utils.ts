import { cn } from "@/lib/cn";
import type {
  CanonicalButtonVariant,
  CanonicalCardVariant,
  CanonicalInfoBlockVariant,
  CanonicalModalVariant,
} from "./tokens";

const CARD_CLASS: Record<CanonicalCardVariant, string> = {
  small: "cds-card--sm",
  medium: "cds-card--md",
  large: "cds-card--lg",
  list: "cds-card--list",
  info: "cds-card--info cds-card--md",
  warning: "cds-card--warning cds-card--md",
  success: "cds-card--success cds-card--md",
  danger: "cds-card--danger cds-card--md",
};

const BUTTON_CLASS: Record<CanonicalButtonVariant, string> = {
  primary: "cds-button--primary",
  secondary: "cds-button--secondary",
  ghost: "cds-button--ghost",
  outline: "cds-button--outline",
  danger: "cds-button--danger",
};

const MODAL_CLASS: Record<CanonicalModalVariant, string> = {
  confirm: "cds-modal--confirm",
  delete: "cds-modal--delete",
  warning: "cds-modal--warning",
  success: "cds-modal--success",
  information: "cds-modal--info",
};

const INFO_BLOCK_CLASS: Record<CanonicalInfoBlockVariant, string> = {
  info: "cds-info-block--info",
  success: "cds-info-block--success",
  error: "cds-info-block--error",
  warning: "cds-info-block--warning",
  description: "cds-info-block--description",
  tip: "cds-info-block--tip",
};

export function cdsCardClass(variant: CanonicalCardVariant = "medium", className?: string) {
  return cn("cds-card", CARD_CLASS[variant], className);
}

export function cdsButtonClass(
  variant: CanonicalButtonVariant = "primary",
  options?: { fullWidth?: boolean; loading?: boolean },
  className?: string,
) {
  return cn(
    "cds-button",
    BUTTON_CLASS[variant],
    options?.fullWidth && "cds-button--full",
    options?.loading && "cds-button--loading",
    className,
  );
}

export function cdsModalClass(variant: CanonicalModalVariant, className?: string) {
  return cn("cds-modal", MODAL_CLASS[variant], className);
}

export function cdsInfoBlockClass(variant: CanonicalInfoBlockVariant, className?: string) {
  return cn("cds-info-block", INFO_BLOCK_CLASS[variant], className);
}

export function cdsInputTypeAttr(
  type: "text" | "email" | "phone" | "number" | "price" | "password" | "search" | "time",
): string {
  if (type === "phone") return "tel";
  if (type === "price") return "number";
  return type;
}

/**
 * ROVEXO Canonical Design System v1.0
 * Master UI kit — single source of truth for platform migration.
 *
 * @example
 * import {
 *   CanonicalPageLayout,
 *   CanonicalSection,
 *   CanonicalMenuRow,
 * } from "@/src/components/canonical";
 */

export { CDS_VERSION, canonicalTokens } from "./tokens";
export type {
  CanonicalButtonVariant,
  CanonicalCardVariant,
  CanonicalInfoBlockVariant,
  CanonicalInputType,
  CanonicalModalVariant,
  CanonicalSelectorKind,
  CanonicalSelectorOption,
  CanonicalSelectorOptionGroup,
} from "./tokens";

export { CanonicalPageLayout } from "./CanonicalPageLayout";
export type { CanonicalPageLayoutProps } from "./CanonicalPageLayout";

export {
  CanonicalPageHeader,
  CanonicalPageHeaderBackLink,
} from "./CanonicalPageHeader";
export type { CanonicalPageHeaderProps } from "./CanonicalPageHeader";

export { CanonicalSection } from "./CanonicalSection";
export type { CanonicalSectionProps } from "./CanonicalSection";

export { CanonicalMenuRow } from "./CanonicalMenuRow";
export type { CanonicalMenuRowProps } from "./CanonicalMenuRow";

export { CanonicalCard } from "./CanonicalCard";
export type { CanonicalCardProps } from "./CanonicalCard";

export { CanonicalInput, CanonicalTextarea } from "./CanonicalInput";
export type { CanonicalInputProps, CanonicalTextareaProps } from "./CanonicalInput";

export { CanonicalSelector } from "./CanonicalSelector";
export type { CanonicalSelectorProps } from "./CanonicalSelector";

export { CanonicalButton, CanonicalButtonLink } from "./CanonicalButton";
export type { CanonicalButtonProps, CanonicalButtonLinkProps } from "./CanonicalButton";

export { CanonicalModal } from "./CanonicalModal";
export type { CanonicalModalProps } from "./CanonicalModal";

export { CanonicalConfirmDialog } from "./dialogs/CanonicalConfirmDialog";
export type { CanonicalConfirmDialogProps } from "./dialogs/CanonicalConfirmDialog";

export { CanonicalInfoBlock } from "./CanonicalInfoBlock";
export type { CanonicalInfoBlockProps } from "./CanonicalInfoBlock";

export { CanonicalSwitch } from "./CanonicalSwitch";
export type { CanonicalSwitchProps } from "./CanonicalSwitch";

export { CanonicalCheckbox } from "./CanonicalCheckbox";
export type { CanonicalCheckboxProps } from "./CanonicalCheckbox";

export { CanonicalRadioGroup } from "./CanonicalRadio";
export type { CanonicalRadioGroupProps, CanonicalRadioOption } from "./CanonicalRadio";

export { CanonicalDivider } from "./CanonicalDivider";
export type { CanonicalDividerProps } from "./CanonicalDivider";

export {
  CANONICAL_ACCOUNT_VERSION,
  canonicalAccountClasses,
  canonicalAccountTokens,
} from "./CanonicalAccountTokens";
export type { CanonicalAccountClasses, CanonicalAccountTokens } from "./CanonicalAccountTokens";

export { CanonicalAccountHeader } from "./CanonicalAccountHeader";
export type { CanonicalAccountHeaderProps } from "./CanonicalAccountHeader";

export {
  CanonicalAccountSection,
  CanonicalAccountSectionCard,
} from "./CanonicalAccountSection";
export type {
  CanonicalAccountSectionProps,
  CanonicalAccountSectionCardProps,
} from "./CanonicalAccountSection";

export {
  cdsButtonClass,
  cdsCardClass,
  cdsInfoBlockClass,
  cdsInputTypeAttr,
  cdsModalClass,
} from "./utils";

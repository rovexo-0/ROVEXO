"use client";

import { memo, useEffect, useId, useState, type MutableRefObject } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { FieldError, fieldErrorClassName } from "@/features/sell/components/FieldError";
import {
  clampListingTitle,
  LISTING_TITLE_MAX,
  validateListingTitle,
} from "@/lib/sell/listing-title";

type ListingTitleFieldProps = {
  id?: string;
  value: string;
  placeholder?: string;
  className?: string;
  showValidation?: boolean;
  onCommit: (title: string) => void;
  /** Optional ref sink for publish-time flush without parent re-renders. */
  pendingTitleRef?: MutableRefObject<string>;
};

export const ListingTitleField = memo(function ListingTitleField({
  id,
  value,
  placeholder = "Listing title",
  className,
  showValidation = false,
  onCommit,
  pendingTitleRef,
}: ListingTitleFieldProps) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const [localTitle, setLocalTitle] = useState(value);
  const [blurred, setBlurred] = useState(false);

  useEffect(() => {
    setLocalTitle((current) => (current === value ? current : value));
  }, [value]);

  const fieldError =
    (blurred || showValidation) ? validateListingTitle(localTitle, { required: showValidation }) : undefined;

  return (
    <div className="flex flex-col gap-ds-1">
      <input
        id={inputId}
        type="text"
        value={localTitle}
        onChange={(event) => {
          const next = clampListingTitle(event.target.value);
          setLocalTitle(next);
          if (pendingTitleRef) pendingTitleRef.current = next;
        }}
        onBlur={() => {
          setBlurred(true);
          const next = clampListingTitle(localTitle);
          setLocalTitle(next);
          if (pendingTitleRef) pendingTitleRef.current = next;
          onCommit(next);
        }}
        placeholder={placeholder}
        maxLength={LISTING_TITLE_MAX}
        autoComplete="off"
        className={cn(className, focusRing, fieldErrorClassName(Boolean(fieldError)))}
      />
      <div className="flex items-center justify-between gap-ds-2">
        <FieldError message={fieldError} />
        <p className="ml-auto text-xs text-text-muted tabular-nums" aria-live="off">
          {localTitle.length} / {LISTING_TITLE_MAX}
        </p>
      </div>
    </div>
  );
});

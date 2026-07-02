"use client";

import {
  memo,
  useEffect,
  useId,
  useRef,
  type MutableRefObject,
} from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { bumpPendingTextVersion } from "@/lib/sell/pending-text-store";
import { FieldError, fieldErrorClassName } from "@/features/sell/components/FieldError";
import { sellFieldClassName } from "@/features/sell/components/sell-ui";

const PENDING_TEXT_BUMP_MS = 300;

type ListingDescriptionFieldProps = {
  externalDescription: string;
  descriptionError?: string;
  pendingDescriptionRef: MutableRefObject<string>;
  flushDescriptionCommitRef: MutableRefObject<(() => void) | null>;
  syncDescriptionToDraft: (description: string) => void;
};

/**
 * Uncontrolled description field — avoids iOS Chrome bugs with controlled
 * textareas while the parent form re-renders during other field updates.
 */
export const ListingDescriptionField = memo(function ListingDescriptionField({
  externalDescription,
  descriptionError,
  pendingDescriptionRef,
  flushDescriptionCommitRef,
  syncDescriptionToDraft,
}: ListingDescriptionFieldProps) {
  const descriptionId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isTypingRef = useRef(false);
  const pendingBumpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    flushDescriptionCommitRef.current = () => {
      isTypingRef.current = false;
      const value = textareaRef.current?.value ?? "";
      pendingDescriptionRef.current = value;
      syncDescriptionToDraft(value);
    };
    return () => {
      flushDescriptionCommitRef.current = null;
    };
  }, [flushDescriptionCommitRef, pendingDescriptionRef, syncDescriptionToDraft]);

  useEffect(() => {
    if (isTypingRef.current) return;
    const textarea = textareaRef.current;
    if (!textarea || textarea.value === externalDescription) {
      pendingDescriptionRef.current = externalDescription;
      return;
    }
    textarea.value = externalDescription;
    pendingDescriptionRef.current = externalDescription;
  }, [externalDescription, pendingDescriptionRef]);

  useEffect(
    () => () => {
      if (pendingBumpTimerRef.current) {
        clearTimeout(pendingBumpTimerRef.current);
      }
    },
    [],
  );

  const schedulePendingTextBump = () => {
    if (pendingBumpTimerRef.current) {
      clearTimeout(pendingBumpTimerRef.current);
    }
    pendingBumpTimerRef.current = setTimeout(() => {
      pendingBumpTimerRef.current = null;
      bumpPendingTextVersion();
    }, PENDING_TEXT_BUMP_MS);
  };

  const flushPendingTextBump = () => {
    if (pendingBumpTimerRef.current) {
      clearTimeout(pendingBumpTimerRef.current);
      pendingBumpTimerRef.current = null;
    }
    bumpPendingTextVersion();
  };

  const handleInput = () => {
    isTypingRef.current = true;
    pendingDescriptionRef.current = textareaRef.current?.value ?? "";
    schedulePendingTextBump();
  };

  const handleBlur = () => {
    isTypingRef.current = false;
    const value = textareaRef.current?.value ?? "";
    pendingDescriptionRef.current = value;
    syncDescriptionToDraft(value);
    flushPendingTextBump();
  };

  return (
    <div className="flex flex-col gap-ds-1">
      <textarea
        ref={textareaRef}
        id={descriptionId}
        defaultValue={externalDescription}
        onInput={handleInput}
        onBlur={handleBlur}
        placeholder="Describe the item — only include details you know are true"
        rows={4}
        aria-label="Listing description"
        autoComplete="off"
        enterKeyHint="done"
        className={cn(
          sellFieldClassName,
          focusRing,
          "min-h-[6rem] resize-none",
          fieldErrorClassName(Boolean(descriptionError)),
        )}
      />
      <FieldError message={descriptionError} />
    </div>
  );
});

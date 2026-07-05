"use client";

import {
  memo,
  useEffect,
  useId,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { FieldError, fieldErrorClassName } from "@/features/sell/components/FieldError";
import {
  clampListingTitle,
  LISTING_TITLE_MAX,
  validateListingTitle,
} from "@/lib/sell/listing-title";
import {
  createTitleIdleScheduler,
  TITLE_IDLE_COMMIT_MS,
} from "@/lib/sell/title-idle-scheduler";

type ListingTitleFieldProps = {
  id?: string;
  /** External title — synced only while the user is not actively typing. */
  externalTitle?: string;
  placeholder?: string;
  className?: string;
  showValidation?: boolean;
  pendingTitleRef?: MutableRefObject<string>;
  /** Called once after {@link TITLE_IDLE_COMMIT_MS} with no further keystrokes. */
  onIdleCommit: (title: string) => void;
  /** Publish / save — flush pending title immediately. */
  flushIdleCommit?: MutableRefObject<(() => void) | null>;
};

export const ListingTitleField = memo(function ListingTitleField({
  id,
  externalTitle = "",
  placeholder = "Listing title",
  className,
  showValidation = false,
  pendingTitleRef,
  onIdleCommit,
  flushIdleCommit,
}: ListingTitleFieldProps) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const [localTitle, setLocalTitle] = useState(externalTitle);
  const [showFieldValidation, setShowFieldValidation] = useState(false);
  const localTitleRef = useRef(localTitle);
  const isTypingRef = useRef(false);

  useEffect(() => {
    localTitleRef.current = localTitle;
  }, [localTitle]);

  const idleSchedulerRef = useRef(
    createTitleIdleScheduler(
      (title) => {
        isTypingRef.current = false;
        onIdleCommit(title);
      },
      () => localTitleRef.current,
      TITLE_IDLE_COMMIT_MS,
    ),
  );

  useEffect(() => {
    const idleScheduler = idleSchedulerRef.current;
    if (flushIdleCommit) {
      flushIdleCommit.current = () => idleScheduler.flush();
    }
    return () => {
      if (flushIdleCommit) flushIdleCommit.current = null;
      idleScheduler.cancel();
    };
  }, [flushIdleCommit]);

  useEffect(() => {
    if (isTypingRef.current) return;
    setLocalTitle((current) => (current === externalTitle ? current : externalTitle));
    if (pendingTitleRef) pendingTitleRef.current = externalTitle;
  }, [externalTitle, pendingTitleRef]);

  const fieldError = showFieldValidation || showValidation
    ? validateListingTitle(localTitle, { required: showValidation })
    : undefined;

  return (
    <div className="flex flex-col gap-ds-1">
      <input
        id={inputId}
        type="text"
        value={localTitle}
        onChange={(event) => {
          const next = clampListingTitle(event.target.value);
          isTypingRef.current = true;
          setLocalTitle(next);
          if (pendingTitleRef) pendingTitleRef.current = next;
          idleSchedulerRef.current.touch();
        }}
        onBlur={() => {
          setShowFieldValidation(true);
        }}
        placeholder={placeholder}
        maxLength={LISTING_TITLE_MAX}
        autoComplete="off"
        enterKeyHint="done"
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

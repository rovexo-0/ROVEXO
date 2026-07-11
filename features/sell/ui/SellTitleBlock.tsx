"use client";

import { memo, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { sellInput, sellInvalid, focusRing } from "@/features/sell/ui/sell-classes";
import { SellSection, SellInlineError } from "@/features/sell/ui/SellPrimitives";
import { bumpPendingTextVersion } from "@/lib/sell/pending-text-store";
import { clampListingTitle, LISTING_TITLE_MAX, validateListingTitle } from "@/lib/sell/listing-title";
import { useSell } from "@/features/sell/context/SellProvider";

const DESCRIPTION_MAX = 500;
const PENDING_BUMP_MS = 300;

/**
 * Title + Description. Inputs are locally controlled and sync to the draft on a
 * debounce + blur — the proven pattern that keeps typing perfectly responsive on
 * mobile (no re-render storms, no input freeze). No browser APIs run at render.
 */
export const SellTitleBlock = memo(function SellTitleBlock() {
  const {
    draft,
    showValidation,
    pendingTitleRef,
    pendingDescriptionRef,
    flushTitleCommitRef,
    flushDescriptionCommitRef,
    syncTitleToDraft,
    syncDescriptionToDraft,
  } = useSell();

  const titleId = useId();
  const descId = useId();

  const [title, setTitle] = useState(draft.title);
  const [description, setDescription] = useState(draft.description);
  const titleRef = useRef(title);
  const descRef = useRef(description);
  const typingTitle = useRef(false);
  const typingDesc = useRef(false);
  const bumpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    titleRef.current = title;
    descRef.current = description;
  });

  useEffect(() => {
    flushTitleCommitRef.current = () => {
      typingTitle.current = false;
      syncTitleToDraft(titleRef.current);
    };
    return () => {
      flushTitleCommitRef.current = null;
    };
  }, [flushTitleCommitRef, syncTitleToDraft]);

  useEffect(() => {
    flushDescriptionCommitRef.current = () => {
      typingDesc.current = false;
      syncDescriptionToDraft(descRef.current);
    };
    return () => {
      flushDescriptionCommitRef.current = null;
    };
  }, [flushDescriptionCommitRef, syncDescriptionToDraft]);

  useEffect(() => {
    if (typingTitle.current) return;
    setTitle((current) => (current === draft.title ? current : draft.title));
    pendingTitleRef.current = draft.title;
  }, [draft.title, pendingTitleRef]);

  useEffect(() => {
    if (typingDesc.current) return;
    setDescription((current) => (current === draft.description ? current : draft.description));
    pendingDescriptionRef.current = draft.description;
  }, [draft.description, pendingDescriptionRef]);

  useEffect(() => {
    autoGrow();
  }, [description]);

  useEffect(() => () => {
    if (bumpTimer.current) clearTimeout(bumpTimer.current);
  }, []);

  const scheduleBump = () => {
    if (bumpTimer.current) clearTimeout(bumpTimer.current);
    bumpTimer.current = setTimeout(() => {
      bumpTimer.current = null;
      bumpPendingTextVersion();
    }, PENDING_BUMP_MS);
  };

  const flushBump = () => {
    if (bumpTimer.current) {
      clearTimeout(bumpTimer.current);
      bumpTimer.current = null;
    }
    bumpPendingTextVersion();
  };

  const titleError = showValidation ? validateListingTitle(title, { required: showValidation }) : undefined;
  const descError = showValidation && description.trim().length < 10 ? "Description must be at least 10 characters." : undefined;

  return (
    <SellSection title="About your item">
      <div className="flex flex-col gap-ds-1">
        <label htmlFor={titleId} className="px-ds-1 text-xs font-medium text-text-muted">
          Title <span className="text-destructive">*</span>
        </label>
        <input
          id={titleId}
          type="text"
          value={title}
          onChange={(event) => {
            const next = clampListingTitle(event.target.value);
            typingTitle.current = true;
            setTitle(next);
            pendingTitleRef.current = next;
            scheduleBump();
          }}
          onBlur={() => {
            typingTitle.current = false;
            syncTitleToDraft(titleRef.current);
            flushBump();
          }}
          placeholder="Tell buyers what you're selling"
          maxLength={LISTING_TITLE_MAX}
          autoComplete="off"
          enterKeyHint="next"
          aria-label="Listing title"
          className={cn(sellInput, focusRing, sellInvalid(Boolean(titleError)))}
        />
        <div className="flex items-center justify-between gap-ds-2">
          <SellInlineError message={titleError} />
          <p className="ml-auto text-xs tabular-nums text-text-muted">{title.length} / {LISTING_TITLE_MAX}</p>
        </div>
      </div>

      <div className="flex flex-col gap-ds-1">
        <label htmlFor={descId} className="px-ds-1 text-xs font-medium text-text-muted">
          Description <span className="text-destructive">*</span>
        </label>
        <textarea
          id={descId}
          ref={textareaRef}
          value={description}
          onChange={(event) => {
            typingDesc.current = true;
            const next = event.target.value.slice(0, DESCRIPTION_MAX);
            setDescription(next);
            pendingDescriptionRef.current = next;
            autoGrow();
            scheduleBump();
          }}
          onBlur={() => {
            typingDesc.current = false;
            syncDescriptionToDraft(descRef.current);
            flushBump();
          }}
          placeholder="Tell buyers more about it"
          rows={3}
          maxLength={DESCRIPTION_MAX}
          autoComplete="off"
          enterKeyHint="done"
          aria-label="Listing description"
          className={cn(sellInput, focusRing, "min-h-[5.5rem] resize-none overflow-hidden", sellInvalid(Boolean(descError)))}
        />
        <div className="flex items-center justify-between gap-ds-2">
          <SellInlineError message={descError} />
          <p className="ml-auto text-xs tabular-nums text-text-muted">{description.length} / {DESCRIPTION_MAX}</p>
        </div>
      </div>
    </SellSection>
  );
});

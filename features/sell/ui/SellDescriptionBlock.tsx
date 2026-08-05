"use client";

import { memo, useEffect, useId, useRef, useState } from "react";
import { CanonicalTextarea } from "@/src/components/canonical";
import { bumpPendingTextVersion } from "@/lib/sell/pending-text-store";
import { useSellActions, useSellDraft } from "@/features/sell/context/SellProvider";

const DESCRIPTION_MAX = 5000;
const DESCRIPTION_MIN = 10;
const PENDING_BUMP_MS = 300;

export const SellDescriptionBlock = memo(function SellDescriptionBlock({
  onStepComplete,
}: {
  onStepComplete?: () => void;
}) {
  const { draft } = useSellDraft();
  const {
    pendingDescriptionRef,
    flushDescriptionCommitRef,
    syncDescriptionToDraft,
    markDescriptionManuallyEdited,
  } = useSellActions();
  const descId = useId();
  const [description, setDescription] = useState(draft.description);
  const descRef = useRef(description);
  const typingDesc = useRef(false);
  const bumpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const autoGrow = () => {
    const el = document.getElementById(descId) as HTMLTextAreaElement | null;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(Math.max(el.scrollHeight, 72), Math.round(window.innerHeight * 0.4));
    el.style.height = `${next}px`;
  };

  useEffect(() => {
    descRef.current = description;
  });

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
    if (typingDesc.current) return;
    setDescription((current) => (current === draft.description ? current : draft.description));
    pendingDescriptionRef.current = draft.description;
  }, [draft.description, pendingDescriptionRef]);

  useEffect(() => {
    autoGrow();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- descId is stable for the field lifetime
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

  return (
    <div className="w-full max-w-none">
      <CanonicalTextarea
        id={descId}
        label="Description"
        value={description}
        onChange={(event) => {
          typingDesc.current = true;
          const next = event.target.value.slice(0, DESCRIPTION_MAX);
          setDescription(next);
          pendingDescriptionRef.current = next;
          markDescriptionManuallyEdited(next);
          autoGrow();
          scheduleBump();
        }}
        onBlur={() => {
          typingDesc.current = false;
          syncDescriptionToDraft(descRef.current);
          flushBump();
          onStepComplete?.();
        }}
        placeholder="Describe your item"
        rows={3}
        maxLength={DESCRIPTION_MAX}
        autoComplete="off"
        enterKeyHint="done"
        aria-label="Listing description"
        aria-describedby={`${descId}-hint`}
        className="sell-description-compact min-h-[72px] max-h-[40vh] resize-y overflow-y-auto"
      />
      <p id={`${descId}-hint`} className="mt-0.5 text-xs text-muted-foreground">
        {description.trim().length < DESCRIPTION_MIN
          ? `Minimum ${DESCRIPTION_MIN} characters`
          : `${description.length}/${DESCRIPTION_MAX}`}
      </p>
    </div>
  );
});

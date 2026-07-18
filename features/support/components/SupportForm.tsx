"use client";

import {
  CanonicalButton,
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalInput,
  CanonicalMenuRow,
  CanonicalSection,
  CanonicalSelector,
  CanonicalTextarea,
} from "@/src/components/canonical";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";

import { AccountCanonicalShell } from "@/features/account-canonical";
import { HeadsetLineIcon, MailLineIcon } from "@/components/icons/RvxLineIcons";
import { PlatformOperatorContactSection } from "@/components/legal/PlatformOperatorContactSection";
import {
  buildSupportContext,
  canAccessSupport,
  readHelpSession,
  trackHelpEvent,
} from "@/lib/help/session";
import { SUPPORT_CATEGORIES } from "@/lib/support/types";

function SupportFormFields() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const guided = searchParams.get("guided") === "1";
  const [session] = useState(readHelpSession);
  const [category, setCategory] = useState(searchParams.get("category") ?? "account");
  const [subject, setSubject] = useState(
    searchParams.get("listing") ? `Appeal moderation — ${searchParams.get("listing")}` : "",
  );
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const supportAllowed = useMemo(() => !guided || canAccessSupport(session), [guided, session]);

  const submit = async () => {
    if (!supportAllowed) {
      setError("Complete guided help before contacting Support.");
      void trackHelpEvent({ type: "support_gate_block", topicSlug: session.topicSlug ?? undefined });
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const attachmentUrls: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadResponse = await fetch("/api/support/upload", { method: "POST", body: formData });
        const uploadPayload = (await uploadResponse.json()) as { path?: string; error?: string };
        if (!uploadResponse.ok || !uploadPayload.path) {
          setError(uploadPayload.error ?? "Attachment upload failed.");
          return;
        }
        attachmentUrls.push(uploadPayload.path);
      }

      const helpContext = buildSupportContext(session, pathname);

      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subject,
          description,
          attachmentUrls,
          helpContext,
        }),
      });

      const payload = (await response.json()) as { success?: boolean; error?: string; ticketNumber?: string };
      if (!response.ok || !payload.success) {
        setError(payload.error ?? "Unable to submit support request.");
        return;
      }

      void trackHelpEvent({ type: "support_submit", topicSlug: session.topicSlug ?? undefined });
      router.push(`/support/success?ticket=${encodeURIComponent(payload.ticketNumber ?? "")}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-ds-4">
      {!supportAllowed ? (
        <CanonicalInfoBlock variant="warning">
          Complete guided help first.
          {session.topicSlug ? (
            <>
              {" "}
              <Link href={`/help/category/${session.topicSlug}`} className="font-medium text-primary underline">
                Continue guide
              </Link>
            </>
          ) : (
            <>
              {" "}
              <Link href="/help" className="font-medium text-primary underline">
                Open Help Centre
              </Link>
            </>
          )}
        </CanonicalInfoBlock>
      ) : null}

      <CanonicalSelector
        label="Category"
        id="support-category"
        kind="generic"
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        options={SUPPORT_CATEGORIES.map((item) => ({ value: item.id, label: item.label }))}
      />

      <CanonicalInput
        id="support-subject"
        label="Subject"
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
      />

      <CanonicalTextarea
        id="support-description"
        label="Description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={6}
      />

      <div className="cds-field">
        <label htmlFor="support-attachments" className="cds-field__label">
          Attachments
        </label>
        <input
          id="support-attachments"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          className="cds-input"
        />
      </div>

      {session.path.length > 0 ? (
        <CanonicalInfoBlock variant="description">
          Help context attached ({session.path.length} steps).
        </CanonicalInfoBlock>
      ) : null}

      {error ? <CanonicalInfoBlock variant="error">{error}</CanonicalInfoBlock> : null}

      <CanonicalButton
        fullWidth
        disabled={submitting || !subject.trim() || !description.trim() || !supportAllowed}
        loading={submitting}
        onClick={() => void submit()}
      >
        Submit
      </CanonicalButton>
    </div>
  );
}

function SupportFormFallback() {
  return <CanonicalInfoBlock variant="description">Loading…</CanonicalInfoBlock>;
}

export function SupportForm() {
  return (
    <Suspense fallback={<SupportFormFallback />}>
      <SupportFormFields />
    </Suspense>
  );
}

export function SupportPage() {
  return (
    <AccountCanonicalShell title="Contact Support" backHref="/help" backLabel="Help Centre">
      <CanonicalSection title="Contact">
        <CanonicalCard variant="list" className="w-full">
          <CanonicalMenuRow
            title="Email"
            description="Send a message"
            icon={<MailLineIcon />}
            href="#support-form"
          />
          <CanonicalMenuRow
            title="Report problem"
            description="Order or listing issue"
            icon={<HeadsetLineIcon />}
            href="/support?category=report"
          />
        </CanonicalCard>
      </CanonicalSection>

      <CanonicalSection title="Request">
        <CanonicalCard id="support-form" variant="medium" className="flex w-full flex-col gap-ds-4 p-ds-4">
          <SupportForm />
        </CanonicalCard>
      </CanonicalSection>

      <PlatformOperatorContactSection />
    </AccountCanonicalShell>
  );
}

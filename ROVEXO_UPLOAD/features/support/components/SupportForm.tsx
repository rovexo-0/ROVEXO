"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  buildSupportContext,
  canAccessSupport,
  readHelpSession,
  trackHelpEvent,
} from "@/lib/help/session";
import { SUPPORT_CATEGORIES } from "@/lib/support/types";

export function SupportForm() {
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
      setError("Please complete guided troubleshooting in Help Center before contacting Support.");
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
    <Card padding="lg" className="">
      {!supportAllowed ? (
        <div className="mb-ds-5 rounded-ds-lg bg-surface-muted px-ds-4 py-ds-4 text-sm text-text-secondary">
          Before contacting Support, complete the interactive help guide and try the suggested solutions.
          {session.topicSlug ? (
            <>
              {" "}
              <Link href={`/help/category/${session.topicSlug}`} className="font-medium text-primary underline">
                Continue guided troubleshooting
              </Link>
            </>
          ) : (
            <>
              {" "}
              <Link href="/help" className="font-medium text-primary underline">
                Open Help Center
              </Link>
            </>
          )}
        </div>
      ) : null}

      <div className="grid gap-ds-4">
        <div>
          <label htmlFor="support-category" className="text-sm font-medium text-text-primary">
            Category
          </label>
          <select
            id="support-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-ds-1 w-full rx-input px-ds-3 py-ds-2 text-sm"
          >
            {SUPPORT_CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="support-subject" className="text-sm font-medium text-text-primary">
            Subject
          </label>
          <input
            id="support-subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="mt-ds-1 w-full rx-input px-ds-3 py-ds-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="support-description" className="text-sm font-medium text-text-primary">
            Description
          </label>
          <textarea
            id="support-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={6}
            className="mt-ds-1 w-full rx-input px-ds-3 py-ds-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="support-attachments" className="text-sm font-medium text-text-primary">
            Attachments
          </label>
          <input
            id="support-attachments"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            className="mt-ds-1 block w-full text-sm"
          />
        </div>

        {session.path.length > 0 && (
          <div className="rounded-ds-lg border border-border px-ds-4 py-ds-3 text-xs text-text-secondary">
            <p className="font-medium text-text-primary">Help context attached automatically</p>
            <p className="mt-ds-1">Topic: {session.topicSlug ?? "—"}</p>
            <p>Decision tree steps: {session.path.length}</p>
            <p>Articles viewed: {session.articlesViewed.length}</p>
          </div>
        )}

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <Button
          disabled={submitting || !subject.trim() || !description.trim() || !supportAllowed}
          onClick={() => void submit()}
        >
          Submit request
        </Button>
      </div>
    </Card>
  );
}

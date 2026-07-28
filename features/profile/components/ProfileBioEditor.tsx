"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MyAccountTemplate } from "@/features/account-canonical";
import { PrimaryButton } from "@/src/components/canonical";
import { useToast } from "@/components/ui/Toast";
import "@/styles/rovexo/view-profile-v1.css";

const BIO_MAX = 250;

type ProfileBioEditorProps = {
  initialBio: string | null;
  returnTo: string;
};

/**
 * My Profile v8.0 — Add / Edit Bio (single entry: /account/profile/bio).
 */
export function ProfileBioEditor({ initialBio, returnTo }: ProfileBioEditorProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [bio, setBio] = useState(initialBio ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bio.trim() }),
      });
      if (!response.ok) {
        pushToast({ title: "Unable to save bio.", variant: "error" });
        return;
      }
      pushToast({ title: "Bio updated.", variant: "success" });
      router.push(returnTo);
      router.refresh();
    } catch {
      pushToast({ title: "Unable to save bio.", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <MyAccountTemplate
      surface="personal-information"
      title={initialBio?.trim() ? "Edit Bio" : "Add Bio"}
      backHref={returnTo}
      backLabel="Profile"
      showHeaderTitle
    >
      <div className="vp-v1__bio-page fw-engine__stack" data-profile-bio="v8.0">
        <label className="vp-v1__report-label" htmlFor="profile-bio">
          Bio
          <textarea
            id="profile-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
            rows={5}
            maxLength={BIO_MAX}
            className="vp-v1__report-textarea"
            placeholder="Tell buyers a little more about yourself."
            autoFocus
          />
        </label>
        <p className="vp-v1__bio-counter" aria-live="polite">
          {bio.length}/{BIO_MAX}
        </p>
        <PrimaryButton type="button" loading={saving} onClick={() => void save()}>
          {saving ? "Saving…" : "Save Changes"}
        </PrimaryButton>
      </div>
    </MyAccountTemplate>
  );
}

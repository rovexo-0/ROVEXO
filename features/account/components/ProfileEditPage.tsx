"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { MyAccountTemplate } from "@/features/account-canonical";
import { CanonicalProfileAvatar } from "@/features/profile/components/CanonicalProfileAvatar";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";
import { CanonicalInput, CanonicalSelector } from "@/src/components/canonical";
import {
  ACCOUNT_SETTINGS_COUNTRY_V1,
  ACCOUNT_SETTINGS_CURRENCY_ACTIVE,
  ACCOUNT_SETTINGS_DOM,
  ACCOUNT_SETTINGS_FAIL_CLOSED_COPY,
  ACCOUNT_SETTINGS_FULL_NAME_MAX,
  ACCOUNT_SETTINGS_GENDERS,
  ACCOUNT_SETTINGS_LANGUAGE_V1,
  ACCOUNT_SETTINGS_LOCALE_V1,
  ACCOUNT_SETTINGS_USERNAME_MAX,
  ACCOUNT_SETTINGS_USERNAME_UNAVAILABLE,
  accountSettingsExtrasStorageKey,
  formatDobDisplay,
  formatDobInputAsTyping,
  formatUsernameDisplay,
  isAccountSettingsFormDirty,
  isAtLeastAge,
  maskEmailAddress,
  maskPhoneNumber,
  parseDobDdMmYyyy,
  dobDdMmYyyyToIso,
  dobIsoToDdMmYyyy,
  type AccountSettingsFormSnapshot,
} from "@/lib/account/account-settings-v1";
import {
  SAVE_ENGINE_ANIM_MS,
  SAVE_ENGINE_COPY,
  SAVE_ENGINE_DEBOUNCE_MS,
  SAVE_ENGINE_SUCCESS_MS,
} from "@/lib/account/save-engine-v2";
import { usernameSchema } from "@/lib/account/schemas";
import { coerceUserSafeText } from "@/lib/fail-closed/sanitize";
import type { ProfileDetails } from "@/lib/profile/service";
import { cn } from "@/lib/cn";

type ProfileEditPageProps = {
  initialProfile: ProfileDetails;
  /** Kept for route compatibility — never shown on Personal Information v1.0. */
  accountTypeLabel?: string;
  phoneVerified?: boolean;
  verificationPending?: boolean;
};

type EditorKey =
  | "fullName"
  | "username"
  | "email"
  | "phone"
  | "dob"
  | "gender"
  | "country"
  | null;

type SaveStatus = "idle" | "saving" | "success" | "error";

/** Error toast stays visible longer than the success toast so it can be read. */
const ACCOUNT_SETTINGS_ERROR_DISMISS_MS = SAVE_ENGINE_SUCCESS_MS * 2;

function SettingsRow({
  title,
  value,
  valueClassName,
  badge,
  onOpen,
  expanded,
  showChevron = true,
  trailing,
  children,
  rowId,
}: {
  title: string;
  value?: string;
  valueClassName?: string;
  badge?: ReactNode;
  onOpen?: () => void;
  expanded?: boolean;
  showChevron?: boolean;
  trailing?: ReactNode;
  children?: ReactNode;
  rowId?: string;
}) {
  return (
    <div className="as-v1-row" data-expanded={expanded ? "true" : "false"} id={rowId}>
      <button
        type="button"
        className="as-v1-row__hit"
        onClick={onOpen}
        disabled={!onOpen}
        aria-expanded={expanded}
      >
        <span className="as-v1-row__copy">
          <span className="as-v1-row__title">{title}</span>
          {value ? <span className={cn("as-v1-row__value", valueClassName)}>{value}</span> : null}
        </span>
        <span className="as-v1-row__trailing">
          {badge}
          {trailing}
          {showChevron ? (
            <ChevronRightLineIcon className="as-v1-row__chevron" aria-hidden />
          ) : null}
        </span>
      </button>
      {expanded && children ? <div className="as-v1-row__editor">{children}</div> : null}
    </div>
  );
}

function readExtras(username: string): Pick<AccountSettingsFormSnapshot, "dob" | "gender"> {
  if (typeof window === "undefined") return { dob: "", gender: "" };
  try {
    const raw = window.localStorage.getItem(accountSettingsExtrasStorageKey(username));
    if (!raw) return { dob: "", gender: "" };
    const parsed = JSON.parse(raw) as { dob?: string; gender?: string };
    return {
      dob: typeof parsed.dob === "string" ? parsed.dob : "",
      gender: typeof parsed.gender === "string" ? parsed.gender : "",
    };
  } catch {
    return { dob: "", gender: "" };
  }
}

function writeExtras(username: string, dob: string, gender: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      accountSettingsExtrasStorageKey(username),
      JSON.stringify({ dob, gender }),
    );
  } catch {
    /* fail closed silently for storage */
  }
}

/**
 * ROVEXO PERSONAL INFORMATION v1.0 (PERMANENT LOCK)
 * Save Engine v2.0 — automatic save · Profile master design · content only.
 */
export function ProfileEditPage({
  initialProfile,
  phoneVerified = false,
}: ProfileEditPageProps) {
  void phoneVerified;
  const scrollYRef = useRef(0);
  const saveTimerRef = useRef<number | null>(null);
  const dismissTimerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const savingRef = useRef(false);
  const rerunRef = useRef(false);
  const scheduleSaveRef = useRef<() => void>(() => {});
  const initialExtras = readExtras(initialProfile.username);
  const serverDob = dobIsoToDdMmYyyy(initialProfile.dateOfBirth);

  const initialSnapshot: AccountSettingsFormSnapshot = {
    fullName: initialProfile.fullName,
    username: initialProfile.username,
    email: initialProfile.email,
    phone: initialProfile.phone ?? "",
    dob: serverDob || initialExtras.dob,
    gender: initialExtras.gender,
  };

  const [profile, setProfile] = useState(initialProfile);
  const [editor, setEditor] = useState<EditorKey>(null);
  const [form, setForm] = useState<AccountSettingsFormSnapshot>(initialSnapshot);
  const [usernameHint, setUsernameHint] = useState<string | null>(null);
  const [usernameOk, setUsernameOk] = useState(true);
  const [baseline, setBaseline] = useState<AccountSettingsFormSnapshot>(initialSnapshot);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [statusExiting, setStatusExiting] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  const snapshotRef = useRef<AccountSettingsFormSnapshot>(initialSnapshot);
  const baselineRef = useRef<AccountSettingsFormSnapshot>(initialSnapshot);
  const profileRef = useRef<ProfileDetails>(initialProfile);
  const usernameOkRef = useRef(true);

  useEffect(() => {
    baselineRef.current = baseline;
  }, [baseline]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    usernameOkRef.current = usernameOk;
  }, [usernameOk]);

  const restoreScroll = useCallback(() => {
    const y = scrollYRef.current;
    requestAnimationFrame(() => {
      window.scrollTo({ top: y, left: 0, behavior: "auto" });
    });
  }, []);

  const captureScroll = useCallback(() => {
    scrollYRef.current = window.scrollY;
  }, []);

  const toggleEditor = (key: EditorKey) => {
    captureScroll();
    setEditor((current) => (current === key ? null : key));
    restoreScroll();
  };

  const scheduleDismiss = useCallback((delayMs: number) => {
    if (dismissTimerRef.current !== null) window.clearTimeout(dismissTimerRef.current);
    if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current);
    setStatusExiting(false);
    dismissTimerRef.current = window.setTimeout(() => {
      setStatusExiting(true);
      exitTimerRef.current = window.setTimeout(() => {
        setSaveStatus("idle");
        setSaveMessage(null);
        setStatusExiting(false);
      }, SAVE_ENGINE_ANIM_MS);
    }, delayMs);
  }, []);

  /** Save Engine v2.0 — automatic, optimistic, fail-closed. Never a button. */
  const runSave = useCallback(async () => {
    if (savingRef.current) {
      rerunRef.current = true;
      return;
    }

    const snapshot = snapshotRef.current;
    const currentBaseline = baselineRef.current;
    if (!isAccountSettingsFormDirty(snapshot, currentBaseline)) return;

    if (!usernameOkRef.current) {
      captureScroll();
      setForm(currentBaseline);
      snapshotRef.current = currentBaseline;
      setSaveStatus("error");
      setSaveMessage(ACCOUNT_SETTINGS_USERNAME_UNAVAILABLE);
      restoreScroll();
      scheduleDismiss(ACCOUNT_SETTINGS_ERROR_DISMISS_MS);
      return;
    }

    if (snapshot.dob.trim()) {
      const parsedDob = parseDobDdMmYyyy(snapshot.dob);
      if (!parsedDob) {
        captureScroll();
        setForm(currentBaseline);
        snapshotRef.current = currentBaseline;
        setEditor("dob");
        setSaveStatus("error");
        setSaveMessage("Enter date of birth as DD/MM/YYYY.");
        restoreScroll();
        scheduleDismiss(ACCOUNT_SETTINGS_ERROR_DISMISS_MS);
        return;
      }
      if (!isAtLeastAge(parsedDob)) {
        captureScroll();
        setForm(currentBaseline);
        snapshotRef.current = currentBaseline;
        setEditor("dob");
        setSaveStatus("error");
        setSaveMessage("You must be 18 or older.");
        restoreScroll();
        scheduleDismiss(ACCOUNT_SETTINGS_ERROR_DISMISS_MS);
        return;
      }
    }

    const fail = (message: string) => {
      setForm(currentBaseline);
      snapshotRef.current = currentBaseline;
      setSaveStatus("error");
      setSaveMessage(message);
      restoreScroll();
      scheduleDismiss(ACCOUNT_SETTINGS_ERROR_DISMISS_MS);
    };

    savingRef.current = true;
    captureScroll();
    setSaveStatus("saving");
    setSaveMessage(SAVE_ENGINE_COPY.saving);
    if (dismissTimerRef.current !== null) window.clearTimeout(dismissTimerRef.current);
    if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current);
    setStatusExiting(false);

    try {
      const activeProfile = profileRef.current;
      const emailChanged = snapshot.email.trim().toLowerCase() !== activeProfile.email.toLowerCase();
      const normalizedUsername = snapshot.username.trim().toLowerCase().replace(/^@+/, "");

      const dobIso = snapshot.dob.trim() ? dobDdMmYyyyToIso(snapshot.dob.trim()) : "";
      if (snapshot.dob.trim() && !dobIso) {
        fail("Enter date of birth as DD/MM/YYYY.");
        setEditor("dob");
        return;
      }

      const [profileResponse, settingsResponse, emailResponse] = await Promise.all([
        fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: snapshot.fullName.trim().slice(0, ACCOUNT_SETTINGS_FULL_NAME_MAX),
            username: normalizedUsername.slice(0, ACCOUNT_SETTINGS_USERNAME_MAX),
            phone: snapshot.phone.trim(),
            dateOfBirth: dobIso ?? "",
          }),
        }),
        fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currency: ACCOUNT_SETTINGS_CURRENCY_ACTIVE,
            localeCode: ACCOUNT_SETTINGS_LOCALE_V1,
            language: ACCOUNT_SETTINGS_LANGUAGE_V1,
          }),
        }),
        emailChanged
          ? fetch("/api/profile/email", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: snapshot.email.trim() }),
            })
          : Promise.resolve(null),
      ]);

      const profilePayload = (await profileResponse.json().catch(() => null)) as {
        profile?: ProfileDetails;
        error?: string;
      } | null;

      if (!profileResponse.ok || !profilePayload?.profile) {
        fail(coerceUserSafeText(profilePayload?.error) || `${SAVE_ENGINE_COPY.unable} ${SAVE_ENGINE_COPY.tryAgain}`);
        return;
      }

      if (emailResponse && !emailResponse.ok) {
        const emailPayload = (await emailResponse.json().catch(() => null)) as { error?: string } | null;
        fail(coerceUserSafeText(emailPayload?.error));
        return;
      }

      if (!settingsResponse.ok) {
        fail(ACCOUNT_SETTINGS_FAIL_CLOSED_COPY);
        return;
      }

      const nextProfile = profilePayload.profile;
      const nextPhone = nextProfile.phone ?? "";
      const nextEmail = emailChanged ? snapshot.email.trim() : nextProfile.email;

      writeExtras(nextProfile.username, snapshot.dob.trim(), snapshot.gender);

      const nextBaseline: AccountSettingsFormSnapshot = {
        fullName: nextProfile.fullName,
        username: nextProfile.username,
        email: nextEmail,
        phone: nextPhone,
        dob: dobIsoToDdMmYyyy(nextProfile.dateOfBirth) || snapshot.dob.trim(),
        gender: snapshot.gender,
      };

      setProfile(nextProfile);
      profileRef.current = nextProfile;
      setForm(nextBaseline);
      snapshotRef.current = nextBaseline;
      setBaseline(nextBaseline);
      baselineRef.current = nextBaseline;

      setSaveStatus("success");
      setSaveMessage(SAVE_ENGINE_COPY.success);
      restoreScroll();
      scheduleDismiss(SAVE_ENGINE_SUCCESS_MS);
    } catch {
      fail(SAVE_ENGINE_COPY.connection);
    } finally {
      savingRef.current = false;
      if (rerunRef.current) {
        rerunRef.current = false;
        scheduleSaveRef.current();
      }
    }
  }, [captureScroll, restoreScroll, scheduleDismiss]);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void runSave();
    }, SAVE_ENGINE_DEBOUNCE_MS);
  }, [runSave]);

  useEffect(() => {
    scheduleSaveRef.current = scheduleSave;
  }, [scheduleSave]);

  const updateField = useCallback(
    <K extends keyof AccountSettingsFormSnapshot>(key: K, value: AccountSettingsFormSnapshot[K]) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        snapshotRef.current = next;
        return next;
      });
    },
    [],
  );

  const checkUsername = useCallback(
    async (raw: string) => {
      const clean = raw.trim().toLowerCase().replace(/^@+/, "");
      const parsed = usernameSchema.safeParse(clean);
      if (!parsed.success) {
        setUsernameOk(false);
        setUsernameHint(ACCOUNT_SETTINGS_USERNAME_UNAVAILABLE);
        return;
      }
      if (clean === profileRef.current.username.toLowerCase()) {
        setUsernameOk(true);
        setUsernameHint(null);
        return;
      }
      try {
        const response = await fetch(`/api/profile/username?username=${encodeURIComponent(clean)}`);
        const payload = (await response.json().catch(() => null)) as { available?: boolean } | null;
        if (!response.ok) {
          setUsernameOk(false);
          setUsernameHint(ACCOUNT_SETTINGS_USERNAME_UNAVAILABLE);
          return;
        }
        setUsernameOk(Boolean(payload?.available));
        setUsernameHint(payload?.available ? null : ACCOUNT_SETTINGS_USERNAME_UNAVAILABLE);
      } catch {
        setUsernameOk(false);
        setUsernameHint(ACCOUNT_SETTINGS_USERNAME_UNAVAILABLE);
      }
    },
    [],
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void checkUsername(form.username);
    }, 350);
    return () => window.clearTimeout(handle);
  }, [form.username, checkUsername]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
      if (dismissTimerRef.current !== null) window.clearTimeout(dismissTimerRef.current);
      if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current);
    };
  }, []);

  const resendVerification = async () => {
    setVerifyMessage(null);
    try {
      const response = await fetch("/api/profile/verify-email", { method: "POST" });
      const payload = (await response.json()) as { error?: string };
      setVerifyMessage(
        response.ok ? "Verification email sent." : coerceUserSafeText(payload.error),
      );
    } catch {
      setVerifyMessage(ACCOUNT_SETTINGS_FAIL_CLOSED_COPY);
    }
  };

  const genderLabel =
    ACCOUNT_SETTINGS_GENDERS.find((item) => item.value === form.gender)?.label ??
    "Optional information.";

  return (
    <MyAccountTemplate
      surface="personal-information"
      title="Personal Information"
      backHref="/account/settings"
      showHeaderTitle
    >
      <div
        className="as-v1 ac-canonical__menu fw-engine__stack"
        data-account-settings={ACCOUNT_SETTINGS_DOM}
        data-personal-information="v1.0"
        data-personal-information-lock="permanent"
        data-profile-master-tokens="v1.0"
      >
        <div className="as-v1__stack">
          <div className="as-v1-row as-v1-row--profile-photo">
            <div className="as-v1-row__hit" style={{ cursor: "default" }}>
              <span className="as-v1-row__copy">
                <span className="as-v1-row__title">Profile Photo</span>
              </span>
            </div>
            <CanonicalProfileAvatar
              name={form.fullName || profile.fullName}
              avatarUrl={profile.avatarUrl}
              onUpdated={(avatarUrl) => {
                captureScroll();
                setProfile((current) => {
                  const next = { ...current, avatarUrl };
                  profileRef.current = next;
                  return next;
                });
                setSaveStatus("success");
                setSaveMessage(SAVE_ENGINE_COPY.success);
                scheduleDismiss(SAVE_ENGINE_SUCCESS_MS);
                restoreScroll();
              }}
            />
          </div>

          <SettingsRow
            title="Full Name"
            value={form.fullName || "Your legal name."}
            expanded={editor === "fullName"}
            onOpen={() => toggleEditor("fullName")}
          >
            <CanonicalInput
              id="as-fullName"
              label="Full Name"
              value={form.fullName}
              maxLength={ACCOUNT_SETTINGS_FULL_NAME_MAX}
              onChange={(event) => updateField("fullName", event.target.value)}
              onBlur={scheduleSave}
            />
          </SettingsRow>

          <SettingsRow
            title="Username"
            value={formatUsernameDisplay(form.username) || "Your public username."}
            expanded={editor === "username"}
            onOpen={() => toggleEditor("username")}
          >
            <CanonicalInput
              id="as-username"
              label="Username"
              value={form.username}
              maxLength={ACCOUNT_SETTINGS_USERNAME_MAX}
              onChange={(event) => updateField("username", event.target.value.toLowerCase())}
              onBlur={scheduleSave}
            />
            {usernameHint ? (
              <p className="as-v1-hint as-v1-hint--error">{usernameHint}</p>
            ) : null}
          </SettingsRow>

          <SettingsRow
            title="Email Address"
            value={maskEmailAddress(form.email || profile.email)}
            badge={
              profile.emailVerified ? (
                <span className="as-v1-badge">Verified</span>
              ) : (
                <button type="button" className="as-v1-connect__btn" onClick={() => void resendVerification()}>
                  Verify
                </button>
              )
            }
            expanded={editor === "email"}
            onOpen={() => toggleEditor("email")}
          >
            <CanonicalInput
              id="as-email"
              label="Email Address"
              inputType="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              onBlur={scheduleSave}
            />
            {verifyMessage ? <p className="as-v1-hint">{verifyMessage}</p> : null}
          </SettingsRow>

          <SettingsRow
            title="Phone Number"
            value={maskPhoneNumber(form.phone)}
            expanded={editor === "phone"}
            onOpen={() => toggleEditor("phone")}
          >
            <CanonicalInput
              id="as-phone"
              label="Phone Number"
              inputType="phone"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              onBlur={scheduleSave}
              placeholder="+44 7…"
            />
          </SettingsRow>

          <SettingsRow
            title="Date of Birth"
            value={formatDobDisplay(form.dob)}
            expanded={editor === "dob"}
            onOpen={() => toggleEditor("dob")}
          >
            <CanonicalInput
              id="as-dob"
              label="Date of Birth"
              value={form.dob}
              placeholder="DD/MM/YYYY"
              inputMode="numeric"
              autoComplete="bday"
              onChange={(event) => updateField("dob", formatDobInputAsTyping(event.target.value))}
              onBlur={scheduleSave}
            />
            <p className="as-v1-hint">Minimum age 18+ · DD/MM/YYYY</p>
          </SettingsRow>

          <SettingsRow
            title="Gender (Optional)"
            value={genderLabel}
            expanded={editor === "gender"}
            onOpen={() => toggleEditor("gender")}
          >
            <CanonicalSelector
              id="as-gender"
              label="Gender (Optional)"
              kind="generic"
              value={form.gender}
              onChange={(event) => {
                updateField("gender", event.target.value);
                scheduleSave();
              }}
              options={[
                { value: "", label: "Prefer not to say" },
                ...ACCOUNT_SETTINGS_GENDERS.map((item) => ({
                  value: item.value,
                  label: item.label,
                })),
              ]}
            />
          </SettingsRow>

          <SettingsRow
            title="Country"
            value={ACCOUNT_SETTINGS_COUNTRY_V1}
            expanded={editor === "country"}
            onOpen={() => toggleEditor("country")}
            rowId="country"
          >
            <CanonicalSelector
              id="as-country"
              label="Country"
              kind="country"
              value={ACCOUNT_SETTINGS_COUNTRY_V1}
              disabled
              options={[{ value: ACCOUNT_SETTINGS_COUNTRY_V1, label: ACCOUNT_SETTINGS_COUNTRY_V1 }]}
              onChange={() => undefined}
            />
            <p className="as-v1-hint">International support is inactive in v1.0.</p>
          </SettingsRow>
        </div>

        {saveMessage ? (
          <div
            className={cn("as-v1-status", statusExiting && "as-v1-status--out")}
            aria-live="polite"
          >
            <span
              className={cn(
                "as-v1-status__pill",
                saveStatus === "success" && "as-v1-status__pill--success",
                saveStatus === "error" && "as-v1-status__pill--error",
              )}
            >
              {saveMessage}
            </span>
          </div>
        ) : null}
      </div>
    </MyAccountTemplate>
  );
}

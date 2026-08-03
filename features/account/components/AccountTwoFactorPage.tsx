"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  CanonicalButton,
  CanonicalInfoBlock,
  CanonicalInput,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import { MyAccountTemplate } from "@/features/account-canonical";
import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";
import { SettingsMenuIconGlyph } from "@/features/account-module/components/SettingsMenuIcon";
import { MFA_TOTP_V1 } from "@/lib/auth/mfa/ssot";

type MfaStatus = {
  enabled: boolean;
  factorCount: number;
  unusedRecoveryCodes: number;
  rememberDeviceEnabled: boolean;
};

type EnrollPayload = {
  factorId: string;
  qrCode: string;
  secret: string;
};

type Phase = "status" | "enroll" | "recovery_show" | "disable" | "regenerate";

function qrImageSrc(qrCode: string): string {
  if (qrCode.startsWith("data:")) return qrCode;
  if (qrCode.trimStart().startsWith("<svg")) {
    return `data:image/svg+xml;utf-8,${encodeURIComponent(qrCode)}`;
  }
  return qrCode;
}

function downloadRecoveryCodes(codes: string[]) {
  const body = [
    "ROVEXO Two-Factor Authentication — Recovery Codes",
    "Store these codes securely. Each code can be used once.",
    "",
    ...codes,
    "",
  ].join("\n");
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "rovexo-recovery-codes.txt";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AccountTwoFactorPage() {
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [phase, setPhase] = useState<Phase>("status");
  const [enroll, setEnroll] = useState<EnrollPayload | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [useRecoveryForDisable, setUseRecoveryForDisable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  const refreshStatus = useCallback(async () => {
    const response = await fetch("/api/auth/mfa/status");
    if (!response.ok) throw new Error("unavailable");
    const payload = (await response.json()) as MfaStatus;
    setStatus(payload);
    return payload;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const payload = await refreshStatus();
        if (!cancelled) setStatus(payload);
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshStatus]);

  async function startEnroll() {
    setError(null);
    setSecretCopied(false);
    setPending(true);
    try {
      const response = await fetch("/api/auth/mfa/enroll", { method: "POST" });
      const payload = (await response.json()) as EnrollPayload & { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Unable to start enrollment.");
        return;
      }
      if (!payload.factorId || !payload.qrCode || !payload.secret) {
        setError("Enrollment response incomplete. Try again.");
        return;
      }
      setEnroll({
        factorId: payload.factorId,
        qrCode: payload.qrCode,
        secret: payload.secret,
      });
      setPhase("enroll");
      setCode("");
    } catch {
      setError("Unable to start enrollment.");
    } finally {
      setPending(false);
    }
  }

  async function confirmEnroll(event: FormEvent) {
    event.preventDefault();
    if (!enroll) return;
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/auth/mfa/verify-enrollment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factorId: enroll.factorId, code: code.trim() }),
      });
      const payload = (await response.json()) as {
        error?: string;
        recoveryCodes?: string[];
        enabled?: boolean;
      };
      if (!response.ok || !payload.enabled || !payload.recoveryCodes?.length) {
        setError(payload.error ?? "Verification failed. MFA remains disabled.");
        return;
      }
      setRecoveryCodes(payload.recoveryCodes);
      setPhase("recovery_show");
      await refreshStatus();
    } catch {
      setError("Unable to verify enrollment.");
    } finally {
      setPending(false);
    }
  }

  async function disableMfa(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const body = useRecoveryForDisable
        ? { password, recoveryCode: recoveryCode.trim() }
        : { password, code: code.trim() };
      const response = await fetch("/api/auth/mfa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { error?: string; enabled?: boolean };
      if (!response.ok) {
        setError(payload.error ?? "Unable to disable 2FA.");
        return;
      }
      setPhase("status");
      setPassword("");
      setCode("");
      setRecoveryCode("");
      setUseRecoveryForDisable(false);
      await refreshStatus();
    } catch {
      setError("Unable to disable 2FA.");
    } finally {
      setPending(false);
    }
  }

  async function regenerateCodes(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/auth/mfa/recovery/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const payload = (await response.json()) as {
        error?: string;
        recoveryCodes?: string[];
      };
      if (!response.ok || !payload.recoveryCodes?.length) {
        setError(payload.error ?? "Unable to regenerate recovery codes.");
        return;
      }
      setRecoveryCodes(payload.recoveryCodes);
      setPhase("recovery_show");
      setCode("");
      await refreshStatus();
    } catch {
      setError("Unable to regenerate recovery codes.");
    } finally {
      setPending(false);
    }
  }

  async function copySecret() {
    if (!enroll?.secret) return;
    try {
      await navigator.clipboard.writeText(enroll.secret);
      setSecretCopied(true);
      window.setTimeout(() => setSecretCopied(false), 2000);
    } catch {
      setError("Unable to copy secret. Select and copy it manually.");
    }
  }

  if (loadFailed) {
    return (
      <MyAccountTemplate
        surface="security"
        title="Two Factor Authentication"
        backHref="/account/security"
        backLabel="Security"
        showHeaderTitle
      >
        <FailClosedPanel density="section" onRetry={() => window.location.reload()} />
      </MyAccountTemplate>
    );
  }

  const isEnabled = Boolean(status?.enabled);
  const isLoadingStatus = status === null && phase === "status";

  return (
    <MyAccountTemplate
      surface="security"
      title="Two Factor Authentication"
      backHref="/account/security"
      backLabel="Security"
      showHeaderTitle
    >
      <div
        className="settings-subpage-v1 fw-engine__stack"
        data-full-width-surface="security-2fa"
        data-mfa-version={MFA_TOTP_V1.version}
        data-mfa-phase={phase}
        data-mfa-enabled={isEnabled ? "true" : "false"}
      >
        {error ? (
          <CanonicalInfoBlock variant="description">{error}</CanonicalInfoBlock>
        ) : null}

        {phase === "status" ? (
          <>
            <CanonicalSection title="Status">
              <div className="fw-engine__group">
                <CanonicalMenuRow
                  title="Two Factor Authentication"
                  description={
                    isLoadingStatus
                      ? "Loading status…"
                      : isEnabled
                        ? "Authenticator app is enabled."
                        : "Not enabled. MFA stays disabled until verification succeeds."
                  }
                  icon={<SettingsMenuIconGlyph name="shield" tone="rovexo-blue" />}
                  value={isLoadingStatus ? "…" : isEnabled ? "On" : "Off"}
                  showChevron={false}
                />
                <CanonicalMenuRow
                  title="Recovery Codes"
                  description={
                    isEnabled
                      ? `${status?.unusedRecoveryCodes ?? 0} unused codes remaining.`
                      : "Generated after successful enrollment."
                  }
                  icon={<SettingsMenuIconGlyph name="info" tone="red" />}
                  value={isEnabled ? String(status?.unusedRecoveryCodes ?? 0) : "—"}
                  showChevron={false}
                />
                <CanonicalMenuRow
                  title="Remember Device"
                  description="Not available in v1.0."
                  icon={<SettingsMenuIconGlyph name="shield" tone="rovexo-blue" />}
                  value="Off"
                  showChevron={false}
                />
              </div>
            </CanonicalSection>

            <CanonicalSection title="Manage">
              <div className="fw-engine__group" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {isLoadingStatus ? (
                  <CanonicalInfoBlock variant="description">Loading two-factor controls…</CanonicalInfoBlock>
                ) : !isEnabled ? (
                  <CanonicalButton
                    type="button"
                    fullWidth
                    loading={pending}
                    data-testid="mfa-enable"
                    onClick={() => void startEnroll()}
                  >
                    Enable 2FA
                  </CanonicalButton>
                ) : (
                  <>
                    <CanonicalButton
                      type="button"
                      fullWidth
                      variant="secondary"
                      data-testid="mfa-regenerate"
                      onClick={() => {
                        setPhase("regenerate");
                        setCode("");
                        setError(null);
                      }}
                    >
                      Regenerate Recovery Codes
                    </CanonicalButton>
                    <CanonicalButton
                      type="button"
                      fullWidth
                      variant="ghost"
                      data-testid="mfa-disable-open"
                      onClick={() => {
                        setPhase("disable");
                        setPassword("");
                        setCode("");
                        setRecoveryCode("");
                        setError(null);
                      }}
                    >
                      Disable 2FA
                    </CanonicalButton>
                  </>
                )}
              </div>
            </CanonicalSection>
          </>
        ) : null}

        {phase === "enroll" && enroll ? (
          <CanonicalSection title="Enable 2FA">
            <CanonicalInfoBlock variant="description">
              1. Scan the QR code with your authenticator app, or enter the secret manually.
              2. Enter the 6-digit code from the app.
              MFA remains disabled until verification succeeds.
            </CanonicalInfoBlock>
            <div
              style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}
              data-testid="mfa-qr"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Supabase returns SVG data URI */}
              <img
                src={qrImageSrc(enroll.qrCode)}
                alt="Authenticator QR code"
                width={200}
                height={200}
              />
            </div>
            <CanonicalInfoBlock variant="description">
              Manual secret (if you cannot scan the QR):
            </CanonicalInfoBlock>
            <div
              data-testid="mfa-secret"
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 14,
                wordBreak: "break-all",
                padding: "12px 0",
                userSelect: "all",
              }}
            >
              {enroll.secret}
            </div>
            <div className="flex w-full flex-col gap-ds-4" style={{ marginBottom: 16 }}>
              <CanonicalButton type="button" fullWidth variant="secondary" onClick={() => void copySecret()}>
                {secretCopied ? "Secret copied" : "Copy secret"}
              </CanonicalButton>
            </div>
            <form onSubmit={confirmEnroll} className="flex w-full flex-col gap-ds-4" data-testid="mfa-enroll-form">
              <CanonicalInput
                label="Verification Code"
                name="enrollment-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                data-testid="mfa-enroll-code"
              />
              <CanonicalButton type="submit" fullWidth loading={pending} data-testid="mfa-verify-enable">
                Verify and Enable
              </CanonicalButton>
              <CanonicalButton
                type="button"
                fullWidth
                variant="ghost"
                onClick={() => {
                  setPhase("status");
                  setEnroll(null);
                  setCode("");
                  setError(null);
                }}
              >
                Cancel
              </CanonicalButton>
            </form>
          </CanonicalSection>
        ) : null}

        {phase === "recovery_show" && recoveryCodes ? (
          <CanonicalSection title="Recovery Codes">
            <CanonicalInfoBlock variant="description">
              Download and store these codes now. They are shown once. Regenerating invalidates old
              codes. Each code is one-time use.
            </CanonicalInfoBlock>
            <ul
              className="fw-engine__group"
              style={{ listStyle: "none", padding: 0, margin: 0 }}
              data-testid="mfa-recovery-codes"
            >
              {recoveryCodes.map((item) => (
                <li key={item} style={{ fontFamily: "monospace", padding: "8px 0" }}>
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex w-full flex-col gap-ds-4" style={{ marginTop: 16 }}>
              <CanonicalButton
                type="button"
                fullWidth
                data-testid="mfa-recovery-download"
                onClick={() => downloadRecoveryCodes(recoveryCodes)}
              >
                Download Recovery Codes
              </CanonicalButton>
              <CanonicalButton
                type="button"
                fullWidth
                variant="secondary"
                data-testid="mfa-recovery-done"
                onClick={() => {
                  setPhase("status");
                  setRecoveryCodes(null);
                  setEnroll(null);
                }}
              >
                Done
              </CanonicalButton>
            </div>
          </CanonicalSection>
        ) : null}

        {phase === "disable" ? (
          <CanonicalSection title="Disable 2FA">
            <CanonicalInfoBlock variant="description">
              Requires your current password and a valid authenticator code or recovery code.
            </CanonicalInfoBlock>
            <form onSubmit={disableMfa} className="flex w-full flex-col gap-ds-4" data-testid="mfa-disable-form">
              <CanonicalInput
                label="Current Password"
                name="current-password"
                inputType="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              {useRecoveryForDisable ? (
                <CanonicalInput
                  label="Recovery Code"
                  name="recovery-code"
                  value={recoveryCode}
                  onChange={(event) => setRecoveryCode(event.target.value)}
                  required
                />
              ) : (
                <CanonicalInput
                  label="Authenticator Code"
                  name="disable-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                />
              )}
              <CanonicalButton type="submit" fullWidth loading={pending} data-testid="mfa-disable-submit">
                Disable 2FA
              </CanonicalButton>
              <CanonicalButton
                type="button"
                fullWidth
                variant="ghost"
                onClick={() => setUseRecoveryForDisable((value) => !value)}
              >
                {useRecoveryForDisable ? "Use authenticator code" : "Use recovery code"}
              </CanonicalButton>
              <CanonicalButton type="button" fullWidth variant="ghost" onClick={() => setPhase("status")}>
                Cancel
              </CanonicalButton>
            </form>
          </CanonicalSection>
        ) : null}

        {phase === "regenerate" ? (
          <CanonicalSection title="Regenerate Recovery Codes">
            <CanonicalInfoBlock variant="description">
              Enter your authenticator code. Previous recovery codes will be invalidated immediately.
            </CanonicalInfoBlock>
            <form onSubmit={regenerateCodes} className="flex w-full flex-col gap-ds-4">
              <CanonicalInput
                label="Authenticator Code"
                name="regenerate-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
              />
              <CanonicalButton type="submit" fullWidth loading={pending}>
                Regenerate Codes
              </CanonicalButton>
              <CanonicalButton type="button" fullWidth variant="ghost" onClick={() => setPhase("status")}>
                Cancel
              </CanonicalButton>
            </form>
          </CanonicalSection>
        ) : null}
      </div>
    </MyAccountTemplate>
  );
}

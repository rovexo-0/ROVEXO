"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AuthContainer,
  AuthIconInput,
  PrimaryButton,
} from "@/components/auth";
import { RovexoBrandLogo } from "@/components/branding/RovexoBrandLogo";
import { ShieldLineIcon } from "@/components/icons/RvxLineIcons";
import { AuthAlert } from "@/features/auth/components/AuthAlert";
import { AuthLink } from "@/features/auth/components/AuthLink";
import { AuthSpinner } from "@/features/auth/components/AuthSpinner";
import { AUTH_MODULE_VERSION } from "@/lib/auth/canonical";
import { MFA_TOTP_V1 } from "@/lib/auth/mfa/ssot";

type MfaChallengeScreenProps = {
  next?: string;
};

type ChallengePayload = {
  challengeId: string;
  factorId: string;
};

export function MfaChallengeScreen({ next }: MfaChallengeScreenProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [challenge, setChallenge] = useState<ChallengePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const statusRes = await fetch("/api/auth/mfa/status");
        if (!statusRes.ok) {
          if (!cancelled) router.replace("/login");
          return;
        }
        const status = (await statusRes.json()) as {
          requiresChallenge?: boolean;
          enabled?: boolean;
        };
        if (!status.requiresChallenge) {
          if (!cancelled) {
            router.replace(next && next.startsWith("/") ? next : "/");
          }
          return;
        }
        const challengeRes = await fetch("/api/auth/mfa/challenge", { method: "POST" });
        if (!challengeRes.ok) {
          if (!cancelled) setError("Unable to start MFA challenge. Try signing in again.");
          return;
        }
        const payload = (await challengeRes.json()) as ChallengePayload & {
          alreadyVerified?: boolean;
        };
        if (payload.alreadyVerified) {
          if (!cancelled) router.replace(next && next.startsWith("/") ? next : "/");
          return;
        }
        if (!cancelled) {
          setChallenge({ challengeId: payload.challengeId, factorId: payload.factorId });
        }
      } catch {
        if (!cancelled) setError("Unable to load MFA challenge.");
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [next, router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const body = recoveryMode
        ? { recoveryCode: code.trim() }
        : {
            factorId: challenge?.factorId,
            challengeId: challenge?.challengeId,
            code: code.trim(),
          };

      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        verified?: boolean;
      };
      if (!response.ok || !payload.verified) {
        setError(payload.error ?? "Verification failed.");
        if (!recoveryMode) {
          const retry = await fetch("/api/auth/mfa/challenge", { method: "POST" });
          if (retry.ok) {
            const nextChallenge = (await retry.json()) as ChallengePayload;
            setChallenge({
              challengeId: nextChallenge.challengeId,
              factorId: nextChallenge.factorId,
            });
          }
        }
        return;
      }
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
      router.refresh();
    } catch {
      setError("Unable to verify. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="auth-login auth-login--premium auth-platform-theme auth-compact-premium"
      data-auth-module={AUTH_MODULE_VERSION}
      data-auth-screen="mfa-challenge"
      data-mfa-version={MFA_TOTP_V1.version}
      data-remember-device={String(MFA_TOTP_V1.rememberDeviceEnabled)}
    >
      <AuthContainer>
        <div className="auth-login__brand">
          <RovexoBrandLogo className="rovexo-brand-logo--auth" />
        </div>

        <h1 className="auth-heading" style={{ textAlign: "center", marginBottom: 8 }}>
          Two-Factor Authentication
        </h1>
        <p style={{ textAlign: "center", marginBottom: 24, opacity: 0.8, fontSize: 14 }}>
          {recoveryMode
            ? "Enter a one-time recovery code."
            : "Enter the 6-digit code from your authenticator app."}
        </p>

        {booting ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
            <AuthSpinner />
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
            {error ? <AuthAlert message={error} variant="error" /> : null}
            <AuthIconInput
              name="code"
              type="text"
              inputMode={recoveryMode ? "text" : "numeric"}
              autoComplete="one-time-code"
              label={recoveryMode ? "Recovery Code" : "Authenticator Code"}
              icon={<ShieldLineIcon />}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
              autoFocus
            />
            <PrimaryButton type="submit" disabled={pending || (!recoveryMode && !challenge)}>
              {pending ? <AuthSpinner /> : "Verify"}
            </PrimaryButton>
            <button
              type="button"
              className="auth-link"
              style={{ background: "none", border: 0, cursor: "pointer", padding: 8 }}
              onClick={() => {
                setRecoveryMode((value) => !value);
                setCode("");
                setError(null);
              }}
            >
              {recoveryMode ? "Use authenticator code" : "Use a recovery code"}
            </button>
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <AuthLink href="/auth/signout">Sign out</AuthLink>
            </div>
          </form>
        )}
      </AuthContainer>
    </div>
  );
}

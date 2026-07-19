"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AuthAlert } from "@/features/auth/components/AuthAlert";
import { RovexoBrandLogo } from "@/components/branding/RovexoBrandLogo";
import { AuthOAuthButtons, AuthOAuthDivider } from "@/features/auth/components/AuthOAuthButtons";
import { AuthSpinner } from "@/features/auth/components/AuthSpinner";
import type { AuthActionState } from "@/lib/auth/actions";

type AuthFormProps = {
  title: string;
  description: string;
  action: (prev: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  submitLabel: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  initialError?: string;
  beforeSubmit?: (formData: FormData) => string | null;
  successContent?: React.ReactNode;
  showOAuth?: boolean;
  oauthNext?: string;
  oauthDividerLabel?: string;
};

export function AuthForm({
  title,
  description,
  action,
  submitLabel,
  children,
  footer,
  initialError,
  beforeSubmit,
  successContent,
  showOAuth = true,
  oauthNext,
  oauthDividerLabel,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [clientError, setClientError] = useState<string | null>(null);

  const alertMessage = clientError ?? state.error ?? initialError;

  if (state.success && successContent) {
    return <div className="flex w-full flex-col gap-ds-8">{successContent}</div>;
  }

  return (
    <div className="flex w-full flex-col gap-ds-8" data-auth-version="v1.0-legal-lock">
      <header className="flex flex-col items-center gap-ds-6 text-center">
        <RovexoBrandLogo className="rovexo-brand-logo--auth" />
        <div className="flex w-full flex-col gap-ds-2">
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-text-primary">{title}</h1>
          <p className="text-[15px] leading-relaxed text-text-secondary">{description}</p>
        </div>
      </header>

      <form
        action={formAction}
        onSubmit={(event) => {
          setClientError(null);
          if (!beforeSubmit) return;

          const message = beforeSubmit(new FormData(event.currentTarget));
          if (message) {
            event.preventDefault();
            setClientError(message);
          }
        }}
        className="flex flex-col gap-ds-5"
      >
        {alertMessage ? <AuthAlert message={alertMessage} variant="error" /> : null}
        {state.success ? <AuthAlert message={state.success} variant="success" /> : null}

        {children}

        <Button
          type="submit"
          fullWidth
          size="lg"
          disabled={pending}
          aria-busy={pending}
          data-testid="auth-submit"
          className="min-h-[52px] rounded-[16px] text-[17px] font-semibold shadow-ds-medium"
        >
          {pending ? (
            <span className="inline-flex items-center gap-ds-2">
              <AuthSpinner className="h-5 w-5" />
              Please wait…
            </span>
          ) : (
            submitLabel
          )}
        </Button>
      </form>

      {showOAuth ? (
        <>
          <AuthOAuthDivider label={oauthDividerLabel} />
          <AuthOAuthButtons next={oauthNext} />
        </>
      ) : null}

      {footer ? (
        <footer className="text-center text-[15px] leading-relaxed text-text-secondary">
          {footer}
        </footer>
      ) : null}
    </div>
  );
}

export { AuthField } from "@/features/auth/components/AuthField";
export { AuthFieldGroup } from "@/features/auth/components/AuthFieldGroup";
export { AuthSelect } from "@/features/auth/components/AuthSelect";
export { AuthAlert } from "@/features/auth/components/AuthAlert";
export { AuthLink } from "@/features/auth/components/AuthLink";
export { AuthShell } from "@/features/auth/components/AuthShell";
export { AuthLogo } from "@/components/auth/AuthLogo";
export { AuthSpinner } from "@/features/auth/components/AuthSpinner";
export { ResetPasswordFields } from "@/features/auth/components/ResetPasswordFields";
export { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

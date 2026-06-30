"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AuthAlert } from "@/features/auth/components/AuthAlert";
import { AuthLogo } from "@/features/auth/components/AuthLogo";
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
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [clientError, setClientError] = useState<string | null>(null);

  const alertMessage = clientError ?? state.error ?? initialError;

  if (state.success && successContent) {
    return <div className="flex w-full flex-col gap-ds-6">{successContent}</div>;
  }

  return (
    <div className="flex w-full flex-col gap-ds-6">
      <header className="flex flex-col items-center gap-ds-4 text-center">
        <AuthLogo />
        <div className="flex flex-col gap-ds-2">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{title}</h1>
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
        className="flex flex-col gap-ds-4"
      >
        {alertMessage ? <AuthAlert message={alertMessage} variant="error" /> : null}
        {state.success ? <AuthAlert message={state.success} variant="success" /> : null}

        {children}

        <Button
          type="submit"
          fullWidth
          size="lg"
          disabled={pending}
          className="mt-ds-1 min-h-[50px] rounded-ds-xl text-[17px] font-semibold shadow-ds-medium"
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
export { AuthLogo } from "@/features/auth/components/AuthLogo";
export { AuthSpinner } from "@/features/auth/components/AuthSpinner";
export { ResetPasswordFields } from "@/features/auth/components/ResetPasswordFields";
export { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

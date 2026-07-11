"use client";

import { useTransition } from "react";
import { signInWithOAuthProvider } from "@/lib/auth/actions";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type AuthOAuthButtonsProps = {
  next?: string;
  className?: string;
};

function AppleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05 1.88-3.3 1.9-1.24.02-1.64-.74-3.06-.74-1.42 0-1.86.72-3.04.76-1.22.04-2.15-1.23-3.08-2.18C2.8 16.96 1.5 12.58 3.1 9.9c.8-1.32 2.24-2.16 3.8-2.18 1.18-.02 2.3.8 3.04.8.74 0 2.12-.98 3.58-.84 1.22.05 2.34.7 3.04 1.68-2.68 1.48-2.24 5.32.44 6.52-.58 1.5-1.32 2.98-2.35 4.4zM14.03 4.1c.52-1.24.44-2.36-.04-3.36-1.02.08-2.26.68-2.98 1.54-.66.78-1.24 2.04-.68 3.24 1.18.1 2.38-.6 3.7-1.42z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function OAuthButton({
  provider,
  label,
  icon,
  next,
  disabled,
}: {
  provider: "apple" | "google";
  label: string;
  icon: React.ReactNode;
  next?: string;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={disabled || pending}
      aria-busy={pending}
      onClick={() => {
        startTransition(async () => {
          const formData = new FormData();
          formData.set("provider", provider);
          if (next) formData.set("next", next);
          await signInWithOAuthProvider(formData);
        });
      }}
      className={cn(
        "flex min-h-[50px] w-full items-center justify-center gap-ds-2 rounded-ds-xl border border-border/80 bg-surface px-ds-4 text-[16px] font-medium text-text-primary shadow-ds-soft",
        "hover:bg-surface-muted active:scale-[0.99]",
        focusRing,
        (disabled || pending) && "pointer-events-none opacity-60",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export function AuthOAuthDivider({ label = "or continue with" }: { label?: string }) {
  return (
    <div className="relative flex items-center py-ds-1">
      <div className="h-px flex-1 bg-border/70" aria-hidden />
      <span className="px-ds-3 text-xs font-medium uppercase tracking-wide text-text-muted">
        {label}
      </span>
      <div className="h-px flex-1 bg-border/70" aria-hidden />
    </div>
  );
}

export function AuthOAuthButtons({ next, className }: AuthOAuthButtonsProps) {
  return (
    <div className={cn("flex flex-col gap-ds-3", className)}>
      <OAuthButton provider="apple" label="Apple" icon={<AppleIcon />} next={next} />
      <OAuthButton provider="google" label="Google" icon={<GoogleIcon />} next={next} />
    </div>
  );
}

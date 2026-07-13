"use client";

import { AuthOAuthButtons } from "@/features/auth/components/AuthOAuthButtons";
import type { AuthWelcomeSocialProvider } from "@/lib/auth/master-spec";

type SocialLoginProps = {
  next?: string;
  className?: string;
  providers?: readonly AuthWelcomeSocialProvider[];
  labels?: Partial<Record<AuthWelcomeSocialProvider, string>>;
};

export function SocialLogin({ next, className, providers, labels }: SocialLoginProps) {
  return (
    <AuthOAuthButtons
      next={next}
      className={className}
      providers={providers}
      labels={labels}
    />
  );
}

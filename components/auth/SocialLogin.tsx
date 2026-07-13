"use client";

import { AuthOAuthButtons } from "@/features/auth/components/AuthOAuthButtons";
import type { AuthSocialProvider } from "@/lib/auth/master-spec";

type SocialLoginProps = {
  next?: string;
  className?: string;
  providers?: readonly AuthSocialProvider[];
  labels?: Partial<Record<AuthSocialProvider, string>>;
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

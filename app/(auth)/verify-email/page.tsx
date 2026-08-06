import { createClient } from "@/lib/supabase/server";
import { VerifyEmailScreen } from "@/features/auth/components/VerifyEmailScreen";

type VerifyEmailPageProps = {
  searchParams: Promise<{
    email?: string;
    token_hash?: string;
    type?: string;
    code?: string;
    status?: string;
  }>;
};

/**
 * Canonical email verification route — ROVEXO Email Verification UX v1.0.
 * OAuth forbidden on this surface (Cluster 6).
 */
export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = (params.email ?? user?.email ?? "").trim();

  return (
    <VerifyEmailScreen
      email={email}
      tokenHash={params.token_hash ?? null}
      otpType={params.type ?? null}
      code={params.code ?? null}
      status={params.status ?? null}
    />
  );
}

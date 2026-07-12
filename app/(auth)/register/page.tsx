import { redirect } from "next/navigation";
import { signUp } from "@/lib/auth/actions";
import { redirectIfAuthenticated } from "@/lib/auth/guest-redirect";
import { AuthForm, AuthLink } from "@/features/auth/components/AuthForm";
import { RegisterFields } from "@/features/auth/components/RegisterFields";
import { isPublicRegistrationEnabled } from "@/lib/launch-certification/private-mode";

export default async function RegisterPage() {
  await redirectIfAuthenticated();

  if (!isPublicRegistrationEnabled()) {
    redirect("/login?certification=registration-disabled");
  }

  return (
    <AuthForm
      title="Join ROVEXO today 🚀"
      description="Create your free account and start buying, selling and growing your business in minutes."
      action={signUp}
      submitLabel="Create Free Account"
      oauthDividerLabel="Continue with"
      footer={
        <p>
          Already have an account? <AuthLink href="/login">Sign In</AuthLink>
        </p>
      }
    >
      <RegisterFields />
    </AuthForm>
  );
}

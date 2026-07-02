import { redirectIfAuthenticated } from "@/lib/auth/guest-redirect";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  await redirectIfAuthenticated();
  return <ForgotPasswordForm />;
}

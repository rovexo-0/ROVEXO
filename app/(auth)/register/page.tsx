import { redirect } from "next/navigation";
import { redirectIfAuthenticated } from "@/lib/auth/guest-redirect";
import { RegisterScreen } from "@/features/auth/components/RegisterScreen";
import { isPublicRegistrationEnabled } from "@/lib/launch-certification/private-mode";

export const metadata = {
  title: "Create Account",
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  await redirectIfAuthenticated();

  if (!isPublicRegistrationEnabled()) {
    redirect("/login?certification=registration-disabled");
  }

  return <RegisterScreen />;
}

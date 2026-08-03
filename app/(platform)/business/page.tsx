import { redirect } from "next/navigation";
import { BUSINESS_DASHBOARD_ROUTE } from "@/lib/navigation/routes";

export default function BusinessHubRedirect() {
  redirect(BUSINESS_DASHBOARD_ROUTE);
}

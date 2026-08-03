import { redirect } from "next/navigation";
import { BRING_YOUR_ITEM_PATH } from "@/lib/bring-your-item/paths";

/** Legacy alias — forwards to the canonical My Account Bring Your Item page. */
export default function ImportWizardRedirectPage() {
  redirect(BRING_YOUR_ITEM_PATH);
}

import { redirect } from "next/navigation";
import { IMPORT_WIZARD_PATH } from "@/lib/seller/migration/config";

/** Legacy alias — forwards to the import wizard. */
export default function BringYourItemRedirectPage() {
  redirect(IMPORT_WIZARD_PATH);
}

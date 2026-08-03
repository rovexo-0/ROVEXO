import { RovexoIdeasAdmin } from "@/features/super-admin/rovexo-ideas/RovexoIdeasAdmin";
import { listRovexoIdeasForAdmin } from "@/lib/rovexo-ideas/repository";

export const dynamic = "force-dynamic";

export default async function SuperAdminRovexoIdeasPage() {
  const initialIdeas = await listRovexoIdeasForAdmin();
  return <RovexoIdeasAdmin initialIdeas={initialIdeas} />;
}

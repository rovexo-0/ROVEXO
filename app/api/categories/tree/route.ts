import { jsonWithCache } from "@/lib/api/cache-headers";
import { getCategoryTree } from "@/lib/categories/queries";

export async function GET() {
  return jsonWithCache({ tree: getCategoryTree() }, "public-long");
}

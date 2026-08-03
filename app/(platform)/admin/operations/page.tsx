import { ProductionOperationsDashboard } from "@/features/admin/components/ProductionOperationsDashboard";
import { getProductionOperationsSnapshot } from "@/lib/ops/production-status";

export default async function AdminOperationsPage() {
  const data = await getProductionOperationsSnapshot();
  return <ProductionOperationsDashboard data={data} />;
}

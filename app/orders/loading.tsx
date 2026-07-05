import { OrdersSkeleton } from "@/components/skeletons/PageSkeletons";

export default function OrdersLoading() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <OrdersSkeleton />
    </div>
  );
}

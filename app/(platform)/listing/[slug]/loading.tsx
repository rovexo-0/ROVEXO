import { ProductSkeleton } from "@/components/skeletons/PageSkeletons";

export default function ListingLoading() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <ProductSkeleton />
    </div>
  );
}

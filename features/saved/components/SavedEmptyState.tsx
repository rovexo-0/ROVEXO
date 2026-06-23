import { EmptyState } from "@/components/ui/EmptyState";
import { HeartIcon } from "@/features/product-detail/icons";

export function SavedEmptyState() {
  return (
    <EmptyState
      icon={<HeartIcon filled className="h-7 w-7 text-danger" />}
      title="Nothing saved yet"
      description="Save items you love and find them quickly here."
      actionLabel="Start shopping"
      actionHref="/"
    />
  );
}

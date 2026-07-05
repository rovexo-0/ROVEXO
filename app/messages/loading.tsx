import { MessagesSkeleton } from "@/components/skeletons/PageSkeletons";

export default function MessagesLoading() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <MessagesSkeleton />
    </div>
  );
}

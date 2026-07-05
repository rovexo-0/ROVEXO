import { NotificationsSkeleton } from "@/components/skeletons/PageSkeletons";

export default function NotificationsLoading() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <NotificationsSkeleton />
    </div>
  );
}

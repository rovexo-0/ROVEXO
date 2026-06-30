import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export function SettingsLoadingSkeleton() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-5 px-ds-4 py-ds-4">
      <Card padding="lg" className="flex items-center gap-ds-4">
        <Skeleton className="h-16 w-16" rounded="full" />
        <div className="flex flex-1 flex-col gap-ds-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </Card>
      {[1, 2, 3].map((section) => (
        <Card key={section} padding="none" className="overflow-hidden">
          <Skeleton className="mx-ds-4 mt-ds-4 h-3 w-24" />
          <div className="space-y-ds-3 p-ds-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </Card>
      ))}
    </main>
  );
}

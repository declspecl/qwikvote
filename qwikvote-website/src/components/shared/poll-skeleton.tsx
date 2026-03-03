import { Skeleton } from "@/components/ui/skeleton";

export function PollSkeleton() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-5 w-1/2" />
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

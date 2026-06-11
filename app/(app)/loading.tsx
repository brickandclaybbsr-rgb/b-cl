import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="animate-fade-in">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="mt-2 h-4 w-32" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

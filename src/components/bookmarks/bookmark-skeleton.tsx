import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Density } from "@/stores/settings-store";

export function BookmarkCardSkeleton({ density = "comfortable" }: { density?: Density }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card shadow-soft",
        density === "compact" ? "p-3" : "p-4"
      )}
    >
      <div className="flex items-start gap-2.5">
        <Skeleton className="size-8 rounded-md" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      </div>
      {density !== "compact" && (
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      )}
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function BookmarkGridSkeleton({
  count = 8,
  density = "comfortable",
  className,
}: {
  count?: number;
  density?: Density;
  className?: string;
}) {
  return (
    <div className={className} aria-busy role="status" aria-label="Loading bookmarks">
      {Array.from({ length: count }, (_, index) => (
        <BookmarkCardSkeleton key={index} density={density} />
      ))}
    </div>
  );
}

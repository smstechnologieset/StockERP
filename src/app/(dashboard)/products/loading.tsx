import { Skeleton } from "@/components/ui/skeleton";
import { Wheat } from "lucide-react";

export default function ProductsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 animate-pulse">
              <Wheat className="h-4 w-4" />
            </div>
            <Skeleton className="h-7 w-60" />
          </div>
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-72 rounded-md" />
          <Skeleton className="h-9 w-40 rounded-md" />
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex justify-between items-center py-3 border-b last:border-0">
            <div className="space-y-1">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

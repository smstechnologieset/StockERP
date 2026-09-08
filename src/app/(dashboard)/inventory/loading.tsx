import { Skeleton } from "@/components/ui/skeleton";
import { Boxes } from "lucide-react";

export default function InventoryLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 animate-pulse">
              <Boxes className="h-4 w-4" />
            </div>
            <Skeleton className="h-7 w-60" />
          </div>
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-2">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-8 w-28" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex justify-between items-center py-2 border-b">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex justify-between items-center py-3 border-b last:border-0">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

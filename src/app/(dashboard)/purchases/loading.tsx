import { Skeleton } from "@/components/ui/skeleton";
import { PackagePlus } from "lucide-react";

export default function PurchasesLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 animate-pulse">
              <PackagePlus className="h-4 w-4" />
            </div>
            <Skeleton className="h-7 w-64" />
          </div>
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex justify-between items-center py-3 border-b last:border-0">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

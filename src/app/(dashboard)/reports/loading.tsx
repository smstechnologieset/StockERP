import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";

export default function ReportsLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 animate-pulse">
              <BarChart3 className="h-4 w-4" />
            </div>
            <Skeleton className="h-7 w-64" />
          </div>
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-8 w-44 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-xl border bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="lg:col-span-5 rounded-xl border bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="h-64 flex items-center justify-center">
            <Skeleton className="h-44 w-44 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

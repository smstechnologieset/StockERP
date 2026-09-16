import { Loader2, Wheat } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] p-8 animate-in fade-in duration-200">
      <div className="relative flex items-center justify-center mb-6">
        {/* Outer glowing pulsing ring */}
        <div className="absolute h-20 w-20 rounded-full bg-amber-500/20 animate-ping opacity-60" />
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/30">
          <Wheat className="h-8 w-8 animate-bounce" />
        </div>
      </div>

      <div className="flex items-center gap-2.5 text-foreground font-semibold text-base mb-1">
        <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
        <span>መረጃ በመጫን ላይ... / Loading data...</span>
      </div>

      <p className="text-xs text-muted-foreground">
        እባክዎ ትንሽ ይጠብቁ / Please wait a moment...
      </p>

      {/* Shimmer progress line */}
      <div className="w-52 h-1.5 bg-muted rounded-full overflow-hidden mt-5">
        <div className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 rounded-full animate-pulse w-3/4 mx-auto" />
      </div>
    </div>
  );
}

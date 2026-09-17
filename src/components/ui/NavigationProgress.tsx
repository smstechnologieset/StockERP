"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  // Turn off navigation indicator whenever the path or query params update
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  // Intercept clicks on internal links to provide instant feedback
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore external links, anchors, or modifier clicks
      if (
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        target.getAttribute("target") === "_blank" ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey
      ) {
        return;
      }

      // Check if navigating to a different pathname
      const currentPath = window.location.pathname;
      const targetPath = href.split("?")[0].split("#")[0];

      if (targetPath && targetPath !== currentPath) {
        setIsNavigating(true);
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  if (!isNavigating) return null;

  return (
    <>
      {/* Glowing top progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 overflow-hidden bg-amber-500/20">
        <div className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 animate-pulse w-full shadow-[0_0_10px_rgba(245,158,11,0.7)]" />
      </div>

      {/* Prominent centered indicator in the center of the screen */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none animate-in fade-in duration-150">
        <div className="flex items-center gap-3 rounded-2xl bg-card/95 px-6 py-3.5 text-sm font-semibold text-foreground shadow-2xl border border-amber-500/40 backdrop-blur-md animate-in zoom-in-95 duration-150">
          <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
          <span>በመሸጋገር ላይ... / Loading page...</span>
        </div>
      </div>
    </>
  );
}

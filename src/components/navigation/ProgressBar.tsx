"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Complete and reset progress bar when navigation completes
  useEffect(() => {
    if (loading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept click on any link to immediately start progress bar
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("a");
      if (
        target &&
        target.href &&
        target.target !== "_blank" &&
        !target.href.startsWith("tel:") &&
        !target.href.startsWith("mailto:") &&
        !target.download &&
        target.origin === window.location.origin &&
        target.pathname !== window.location.pathname
      ) {
        setLoading(true);
        setProgress(25);

        // Gradually increment to simulate loading progress
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 85) {
              clearInterval(interval);
              return prev;
            }
            return prev + Math.floor(Math.random() * 15) + 5;
          });
        }, 100);

        setTimeout(() => clearInterval(interval), 4000);
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] h-1 pointer-events-none bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-400 shadow-md shadow-amber-500/50 transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 100 ? "all 300ms ease-out" : "width 200ms ease-out",
        }}
      />
    </div>
  );
}

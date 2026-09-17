"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "@/components/navigation/Sidebar";
import { Navbar } from "@/components/navigation/Navbar";

interface DashboardShellProps {
  children: React.ReactNode;
  userRole: "owner_manager" | "staff";
  userName: string;
  userEmail: string;
  branchName: string;
  lowStockCount: number;
}

export function DashboardShell({
  children,
  userRole,
  userName,
  userEmail,
  branchName,
  lowStockCount,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex min-h-screen bg-background text-foreground print:bg-white print:text-black">
      {/* Sidebar — hidden on mobile until opened, always visible on lg+ */}
      <div className="print:hidden">
        <Sidebar
          userRole={userRole}
          userName={userName}
          userEmail={userEmail}
          branchName={branchName}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />
      </div>

      {/* Main Content — no left padding on mobile, 256px offset on desktop */}
      <div className="flex flex-1 flex-col lg:pl-64 transition-all print:pl-0 min-w-0">
        <div className="print:hidden">
          <Navbar
            userRole={userRole}
            lowStockCount={lowStockCount}
            onMenuOpen={openSidebar}
          />
        </div>
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto print:p-0 print:m-0 print:max-w-none">
          {children}
        </main>
      </div>
    </div>
  );
}

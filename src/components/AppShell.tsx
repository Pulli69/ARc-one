"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import StarfieldBackground from "./StarfieldBackground";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isIntroPage = pathname === "/";

  if (isIntroPage) {
    return (
      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative">
        {children}
      </main>
    );
  }

  return (
    <div className="flex w-full h-screen overflow-hidden bg-[#0a0a0f] relative">
      <StarfieldBackground />
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto flex flex-col relative z-10">
        {children}
      </main>
    </div>
  );
}

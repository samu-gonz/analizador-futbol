import type { ReactNode } from "react";
import { AppNav } from "@/components/AppNav";

type AppNavActive = "analysis" | "live" | "standings";

interface AppShellProps {
  children: ReactNode;
  active?: AppNavActive;
}

export function AppShell({ children, active }: AppShellProps) {
  return (
    <div className="relative min-h-screen">
      <div className="relative z-10">
        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#060a12]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-[0_0_20px_-5px_rgba(16,185,129,0.35)]">
                <span className="font-display text-lg font-black text-slate-950">
                  V
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="font-display text-sm font-bold tracking-tight text-white">
                  ValueBet Pro
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Mundial 2026
                </p>
              </div>
            </div>
            <AppNav active={active} />
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

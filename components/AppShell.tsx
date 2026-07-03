import type { ReactNode } from "react";
import { AppNav } from "@/components/AppNav";

type AppNavActive = "analysis" | "live" | "standings" | "combinada";

interface AppShellProps {
  children: ReactNode;
  active?: AppNavActive;
}

export function AppShell({ children, active }: AppShellProps) {
  return (
    <div className="relative min-h-screen">
      <div className="relative z-10">
        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#060a12]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4 md:px-8">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-[0_0_20px_-5px_rgba(16,185,129,0.35)] sm:h-10 sm:w-10">
                <span className="font-display text-base font-black text-slate-950 sm:text-lg">
                  V
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold tracking-tight text-white">
                  ValueBet Pro
                </p>
                <p className="hidden text-[10px] uppercase tracking-[0.2em] text-slate-500 sm:block">
                  Mundial 2026
                </p>
              </div>
            </div>
            <AppNav active={active} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-3 py-4 pb-6 sm:px-6 sm:py-8 md:px-8 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

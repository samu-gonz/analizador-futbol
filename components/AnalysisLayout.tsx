"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MatchSchedule } from "@/components/MatchSchedule";
import type { AnalysedMatch } from "@/types/football";

interface DayOption {
  date: string;
  matchCount: number;
}

interface AnalysisLayoutProps {
  days: DayOption[];
  selectedDate: string;
  matches: AnalysedMatch[];
  selectedMatchId: string;
  featuredMatch: AnalysedMatch | null;
  children: ReactNode;
}

function formatKickoffTime(dateIso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(new Date(dateIso));
}

function shortTeamName(name: string): string {
  if (name.length <= 14) {
    return name;
  }

  return name
    .replace(/\b(FC|CF|United|Republic)\b/gi, "")
    .trim()
    .slice(0, 14)
    .trim();
}

function MobileMatchDrawer({
  open,
  onClose,
  days,
  selectedDate,
  matches,
  selectedMatchId,
}: {
  open: boolean;
  onClose: () => void;
  days: DayOption[];
  selectedDate: string;
  matches: AnalysedMatch[];
  selectedMatchId: string;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Selector de partidos"
    >
      <button
        type="button"
        aria-label="Cerrar selector de partidos"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative mt-auto flex max-h-[92dvh] min-h-[60dvh] flex-col rounded-t-[1.25rem] border border-white/10 bg-[#060a12] shadow-2xl">
        <div className="flex shrink-0 flex-col items-center border-b border-white/[0.06] px-4 pt-3">
          <div className="mb-3 h-1 w-12 rounded-full bg-white/25" aria-hidden />
          <div className="flex w-full items-center justify-between gap-3 pb-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
                Calendario
              </p>
              <h2 className="font-display text-base font-bold text-white">
                Elegir partido
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-white"
            >
              Listo
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <MatchSchedule
            days={days}
            selectedDate={selectedDate}
            matches={matches}
            selectedMatchId={selectedMatchId}
            onMatchSelected={onClose}
            embedded
          />
        </div>
      </div>
    </div>
  );
}

function MobileBottomBar({
  match,
  onOpen,
}: {
  match: AnalysedMatch;
  onOpen: () => void;
}) {
  const { homeTeam, awayTeam, date, status } = match.match;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#060a12]/95 backdrop-blur-xl lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-white/[0.04]"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-sm font-bold text-white">
            {shortTeamName(homeTeam.name)}
          </span>
          <span className="shrink-0 text-[10px] font-semibold uppercase text-slate-500">
            vs
          </span>
          <span className="truncate text-sm font-bold text-white">
            {shortTeamName(awayTeam.name)}
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/25">
            <svg aria-hidden viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
              <path d="M3 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm0 5a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm0 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Z" />
            </svg>
            Partidos
          </span>
          <span className="text-[10px] tabular-nums text-slate-500">
            {formatKickoffTime(date)}
            {status === "live" ? " · En vivo" : ""}
          </span>
        </div>
      </button>
    </div>
  );
}

export function AnalysisLayout({
  days,
  selectedDate,
  matches,
  selectedMatchId,
  featuredMatch,
  children,
}: AnalysisLayoutProps) {
  const [mobilePickerOpen, setMobilePickerOpen] = useState(false);

  useEffect(() => {
    setMobilePickerOpen(false);
  }, [selectedMatchId, selectedDate]);

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[minmax(300px,340px)_1fr] lg:items-start lg:gap-6">
        <div className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] min-h-0">
            <MatchSchedule
              days={days}
              selectedDate={selectedDate}
              matches={matches}
              selectedMatchId={selectedMatchId}
            />
          </div>
        </div>

        <div className="min-w-0 pb-24 lg:pb-0">{children}</div>
      </div>

      {featuredMatch && (
        <MobileBottomBar
          match={featuredMatch}
          onOpen={() => setMobilePickerOpen(true)}
        />
      )}

      <MobileMatchDrawer
        open={mobilePickerOpen}
        onClose={() => setMobilePickerOpen(false)}
        days={days}
        selectedDate={selectedDate}
        matches={matches}
        selectedMatchId={selectedMatchId}
      />
    </>
  );
}

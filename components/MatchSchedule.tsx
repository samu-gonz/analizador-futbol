"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  buildScheduleQuery,
  formatMatchDayLabel,
  formatMatchDaySubtitle,
} from "@/lib/matchDates";
import type { AnalysedMatch } from "@/types/football";

interface DayOption {
  date: string;
  matchCount: number;
}

interface MatchScheduleProps {
  days: DayOption[];
  selectedDate: string;
  matches: AnalysedMatch[];
  selectedMatchId: string;
  onMatchSelected?: () => void;
  embedded?: boolean;
}

function formatKickoffTime(dateIso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(new Date(dateIso));
}

function formatStatus(status: AnalysedMatch["match"]["status"]): {
  label: string;
  className: string;
} {
  if (status === "live") {
    return {
      label: "En vivo",
      className: "border-red-400/30 bg-red-500/15 text-red-300",
    };
  }

  if (status === "finished") {
    return {
      label: "Finalizado",
      className: "border-slate-500/30 bg-slate-500/10 text-slate-400",
    };
  }

  return {
    label: "Programado",
    className: "border-white/10 bg-white/5 text-slate-400",
  };
}

function TeamLogo({ name, logoUrl }: { name: string; logoUrl?: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={name} className="h-6 w-6 object-contain" />
      ) : (
        <span className="text-[10px] font-bold text-slate-300">{initials}</span>
      )}
    </div>
  );
}

export function MatchSchedule({
  days,
  selectedDate,
  matches,
  selectedMatchId,
  onMatchSelected,
  embedded = false,
}: MatchScheduleProps) {
  const router = useRouter();
  const selectedDay = days.find((day) => day.date === selectedDate);
  const dayScrollRef = useRef<HTMLDivElement>(null);
  const dayButtonRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    const container = dayScrollRef.current;
    const selectedButton = dayButtonRefs.current.get(selectedDate);

    if (!container || !selectedButton) {
      return;
    }

    const targetScrollLeft =
      selectedButton.offsetLeft -
      container.clientWidth / 2 +
      selectedButton.clientWidth / 2;

    container.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: "smooth",
    });
  }, [selectedDate, days]);

  return (
    <aside
      className={`flex min-h-0 flex-1 flex-col overflow-hidden ${
        embedded
          ? "h-full bg-transparent"
          : "glass-panel"
      }`}
    >
      {!embedded && (
        <div className="shrink-0 border-b border-white/[0.06] px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
            Calendario
          </p>
          <h2 className="mt-1 font-display text-lg font-bold text-white">
            {formatMatchDaySubtitle(selectedDate)}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {selectedDay?.matchCount ?? 0} partido
            {(selectedDay?.matchCount ?? 0) === 1 ? "" : "s"}
          </p>
        </div>
      )}

      {days.length > 1 ? (
        <div className="shrink-0 border-b border-white/[0.06] px-4 py-3">
          <div
            ref={dayScrollRef}
            className="schedule-scroll flex gap-2 overflow-x-auto pb-0.5 scroll-smooth"
          >
            {days.map((day) => {
              const isSelected = day.date === selectedDate;

              return (
                <button
                  key={day.date}
                  ref={(element) => {
                    if (element) {
                      dayButtonRefs.current.set(day.date, element);
                    } else {
                      dayButtonRefs.current.delete(day.date);
                    }
                  }}
                  type="button"
                  onClick={() => {
                    router.push(buildScheduleQuery(day.date));
                    onMatchSelected?.();
                  }}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    isSelected ? "chip-active" : "chip-inactive"
                  }`}
                >
                  {formatMatchDayLabel(day.date)}
                  <span
                    className={`ml-1.5 text-xs ${isSelected ? "text-emerald-950/70" : "text-slate-500"}`}
                  >
                    ({day.matchCount})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="shrink-0 border-b border-white/[0.06] px-5 py-2">
          <p className="text-xs font-medium text-slate-500">
            {formatMatchDayLabel(selectedDate)} · {selectedDay?.matchCount ?? 0}{" "}
            partido{(selectedDay?.matchCount ?? 0) === 1 ? "" : "s"}
          </p>
        </div>
      )}

      <div className="schedule-scroll min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-4">
        {matches.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-slate-500">
            No hay partidos para este día.
          </p>
        ) : (
          matches.map((item) => {
            const isSelected = item.match.id === selectedMatchId;
            const status = formatStatus(item.match.status);

            return (
              <button
                key={item.match.id}
                type="button"
                onClick={() => {
                  router.push(buildScheduleQuery(selectedDate, item.match.id));
                  onMatchSelected?.();
                }}
                className={`match-card group w-full p-3 text-left ${
                  isSelected ? "match-card-selected" : ""
                }`}
              >
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold tabular-nums text-slate-400">
                    {formatKickoffTime(item.match.date)}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <TeamLogo
                      name={item.match.homeTeam.name}
                      logoUrl={item.match.homeTeam.logoUrl}
                    />
                    <span
                      className={`truncate text-sm font-medium ${
                        isSelected ? "text-white" : "text-slate-300"
                      }`}
                    >
                      {item.match.homeTeam.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <TeamLogo
                      name={item.match.awayTeam.name}
                      logoUrl={item.match.awayTeam.logoUrl}
                    />
                    <span
                      className={`truncate text-sm font-medium ${
                        isSelected ? "text-white" : "text-slate-300"
                      }`}
                    >
                      {item.match.awayTeam.name}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}

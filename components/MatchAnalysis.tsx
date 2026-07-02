import { Suspense } from "react";
import { Bet365MarketsPanel } from "@/components/Bet365MarketsPanel";
import { Bet365MarketsSkeleton } from "@/components/Bet365MarketsSkeleton";
import { isTheOddsApiConfigured } from "@/lib/oddsApi/config";
import { getBet365MarketsForAnalysedMatch } from "@/services/bet365MarketsService";
import type { AnalysedMatch } from "@/types/football";

interface MatchAnalysisProps {
  analysedMatch: AnalysedMatch;
}

function formatMatchTime(dateIso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(new Date(dateIso));
}

function formatStatusLabel(status: AnalysedMatch["match"]["status"]): {
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
    className: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
  };
}

function TeamBadge({
  name,
  logoUrl,
  role,
  align = "left",
}: {
  name: string;
  logoUrl?: string;
  role: "Local" | "Visitante";
  align?: "left" | "right";
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return (
    <div
      className={`flex items-center gap-4 ${align === "right" ? "flex-row-reverse text-right" : ""}`}
    >
      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={name}
            className="h-14 w-14 object-contain"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="font-display text-lg font-bold text-slate-200">
            {initials}
          </span>
        )}
      </div>
      <div>
        <p className="font-display text-xl font-bold tracking-tight text-white md:text-2xl">
          {name}
        </p>
        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {role}
        </p>
      </div>
    </div>
  );
}

async function MatchMarkets({ analysedMatch }: { analysedMatch: AnalysedMatch }) {
  const marketsPayload = await getBet365MarketsForAnalysedMatch(analysedMatch);

  return (
    <Bet365MarketsPanel
      analysedMatch={analysedMatch}
      marketsPayload={marketsPayload}
      oddsApiConfigured={isTheOddsApiConfigured()}
    />
  );
}

export function MatchAnalysis({ analysedMatch }: MatchAnalysisProps) {
  const { match } = analysedMatch;
  const status = formatStatusLabel(match.status);

  return (
    <section className="glass-panel-strong overflow-hidden">
      <header className="relative overflow-hidden border-b border-white/[0.06] px-6 py-8 md:px-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] via-transparent to-cyan-500/[0.04]" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200">
              {match.league.name}
            </span>
            <span className="text-sm text-slate-500">{match.league.country}</span>
          </div>
          <time className="text-sm font-medium tabular-nums text-slate-400">
            {formatMatchTime(match.date)}
          </time>
        </div>

        <div className="relative grid grid-cols-1 items-center gap-8 md:grid-cols-[1fr_auto_1fr]">
          <TeamBadge
            name={match.homeTeam.name}
            logoUrl={match.homeTeam.logoUrl}
            role="Local"
          />

          <div className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-black/30 font-display text-2xl font-black text-slate-600">
              VS
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${status.className}`}
            >
              {status.label}
            </span>
          </div>

          <TeamBadge
            name={match.awayTeam.name}
            logoUrl={match.awayTeam.logoUrl}
            role="Visitante"
            align="right"
          />
        </div>
      </header>

      <div className="p-2 md:p-4">
        <Suspense
          key={match.id}
          fallback={<Bet365MarketsSkeleton oddsApiConfigured={isTheOddsApiConfigured()} />}
        >
          <MatchMarkets analysedMatch={analysedMatch} />
        </Suspense>
      </div>
    </section>
  );
}

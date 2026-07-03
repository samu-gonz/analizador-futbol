import { Suspense } from "react";
import { Bet365MarketsPanel } from "@/components/Bet365MarketsPanel";
import { Bet365MarketsSkeleton } from "@/components/Bet365MarketsSkeleton";
import {
  buildValueCombinadas,
  flattenMarketsPayloadToSelections,
} from "@/lib/combinada/buildValueCombinadas";
import { isTheOddsApiConfigured } from "@/lib/oddsApi/config";
import {
  formatMatchScore,
  isMatchEligibleForCombinada,
  shouldShowMatchScore,
} from "@/lib/matchStatus";
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
  compact = false,
}: {
  name: string;
  logoUrl?: string;
  role: "Local" | "Visitante";
  compact?: boolean;
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  if (compact) {
    return (
      <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02]">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={name}
              className="h-9 w-9 object-contain"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="font-display text-sm font-bold text-slate-200">
              {initials}
            </span>
          )}
        </div>
        <div className="w-full min-w-0">
          <p className="truncate px-1 text-sm font-bold text-white">{name}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {role}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
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
      <div className="min-w-0">
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
  const { match } = analysedMatch;
  const showCombinadaTab = isMatchEligibleForCombinada(match.status);

  const pool = flattenMarketsPayloadToSelections({
    matchId: match.id,
    matchLabel: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
    kickoffIso: match.date,
    tabs: marketsPayload.tabs,
  });

  const combinadas = showCombinadaTab
    ? buildValueCombinadas([pool], {
        minLegs: 2,
        maxLegs: 3,
        maxResults: 5,
      })
    : [];

  return (
    <Bet365MarketsPanel
      analysedMatch={analysedMatch}
      marketsPayload={marketsPayload}
      oddsApiConfigured={isTheOddsApiConfigured()}
      combinadas={combinadas}
      showCombinadaTab={showCombinadaTab}
    />
  );
}

function MatchCenterBadge({
  match,
  status,
}: {
  match: AnalysedMatch["match"];
  status: ReturnType<typeof formatStatusLabel>;
}) {
  if (shouldShowMatchScore(match)) {
    return (
      <div className="flex shrink-0 flex-col items-center gap-2 px-1">
        <span className="font-display text-2xl font-black tabular-nums text-white sm:text-3xl">
          {formatMatchScore(match)}
        </span>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${status.className}`}
        >
          {status.label}
        </span>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-2 px-1">
      <span className="font-display text-lg font-black text-slate-500">VS</span>
      <span
        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${status.className}`}
      >
        {status.label}
      </span>
    </div>
  );
}

function MatchCenterBadgeDesktop({
  match,
  status,
}: {
  match: AnalysedMatch["match"];
  status: ReturnType<typeof formatStatusLabel>;
}) {
  if (shouldShowMatchScore(match)) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex min-w-[7rem] items-center justify-center rounded-2xl border border-white/10 bg-black/30 px-4 py-3 font-display text-3xl font-black tabular-nums text-white">
          {formatMatchScore(match)}
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${status.className}`}
        >
          {status.label}
        </span>
      </div>
    );
  }

  return (
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
  );
}

export function MatchAnalysis({ analysedMatch }: MatchAnalysisProps) {
  const { match } = analysedMatch;
  const status = formatStatusLabel(match.status);

  return (
    <div className="space-y-4">
    <section className="glass-panel-strong overflow-hidden">
      <header className="relative overflow-hidden border-b border-white/[0.06] px-4 py-5 sm:px-6 sm:py-8 md:px-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] via-transparent to-cyan-500/[0.04]" />

        <div className="relative mb-4 flex flex-wrap items-center justify-between gap-2 sm:mb-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-200 sm:px-3 sm:py-1.5 sm:text-xs">
              {match.league.name}
            </span>
          </div>
          <time className="shrink-0 text-xs font-medium tabular-nums text-slate-400 sm:text-sm">
            {formatMatchTime(match.date)}
          </time>
        </div>

        <div className="relative flex items-center justify-between gap-2 sm:gap-4 md:hidden">
          <TeamBadge
            name={match.homeTeam.name}
            logoUrl={match.homeTeam.logoUrl}
            role="Local"
            compact
          />

          <MatchCenterBadge match={match} status={status} />

          <TeamBadge
            name={match.awayTeam.name}
            logoUrl={match.awayTeam.logoUrl}
            role="Visitante"
            compact
          />
        </div>

        <div className="relative hidden items-center gap-8 md:grid md:grid-cols-[1fr_auto_1fr]">
          <TeamBadge
            name={match.homeTeam.name}
            logoUrl={match.homeTeam.logoUrl}
            role="Local"
          />

          <MatchCenterBadgeDesktop match={match} status={status} />

          <div className="justify-self-end">
            <TeamBadge
              name={match.awayTeam.name}
              logoUrl={match.awayTeam.logoUrl}
              role="Visitante"
            />
          </div>
        </div>
      </header>

      <div className="p-2 sm:p-3 md:p-4">
        <Suspense
          key={match.id}
          fallback={<Bet365MarketsSkeleton oddsApiConfigured={isTheOddsApiConfigured()} />}
        >
          <MatchMarkets analysedMatch={analysedMatch} />
        </Suspense>
      </div>
    </section>
    </div>
  );
}

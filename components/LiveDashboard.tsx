"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calculateFairOdd } from "@/lib/valueBetting";
import { LIVE_POLL_INTERVAL_MS } from "@/services/liveEngine";
import type {
  LiveAnalysedMatch,
  LiveApiResponse,
  LiveMarketRow,
  LiveOddsFlashMap,
  LiveOddsKey,
  TodayFixtureSummary,
} from "@/types/liveMatch";

function buildMarketRows(item: LiveAnalysedMatch): LiveMarketRow[] {
  const { match, odds, predictions } = item;

  return [
    {
      key: "1x2-home",
      market: "Resultado 1X2",
      selection: match.homeTeam.name,
      ourProbability: predictions.matchResult1X2.home.probability,
      fairOdd: calculateFairOdd(predictions.matchResult1X2.home.probability),
      marketOdd: odds.matchResult1X2.home,
      hasValue: predictions.matchResult1X2.home.hasValue,
    },
    {
      key: "1x2-draw",
      market: "Resultado 1X2",
      selection: "Empate",
      ourProbability: predictions.matchResult1X2.draw.probability,
      fairOdd: calculateFairOdd(predictions.matchResult1X2.draw.probability),
      marketOdd: odds.matchResult1X2.draw,
      hasValue: predictions.matchResult1X2.draw.hasValue,
    },
    {
      key: "1x2-away",
      market: "Resultado 1X2",
      selection: match.awayTeam.name,
      ourProbability: predictions.matchResult1X2.away.probability,
      fairOdd: calculateFairOdd(predictions.matchResult1X2.away.probability),
      marketOdd: odds.matchResult1X2.away,
      hasValue: predictions.matchResult1X2.away.hasValue,
    },
    {
      key: "ag-over",
      market: `Goles Asiáticos ${odds.asianGoals.line}`,
      selection: "Más",
      ourProbability: predictions.asianGoals.over.probability,
      fairOdd: calculateFairOdd(predictions.asianGoals.over.probability),
      marketOdd: odds.asianGoals.over,
      hasValue: predictions.asianGoals.over.hasValue,
    },
    {
      key: "ag-under",
      market: `Goles Asiáticos ${odds.asianGoals.line}`,
      selection: "Menos",
      ourProbability: predictions.asianGoals.under.probability,
      fairOdd: calculateFairOdd(predictions.asianGoals.under.probability),
      marketOdd: odds.asianGoals.under,
      hasValue: predictions.asianGoals.under.hasValue,
    },
    {
      key: "ah-home",
      market: `Hándicap Asiático ${odds.asianHandicap.line > 0 ? "+" : ""}${odds.asianHandicap.line}`,
      selection: match.homeTeam.name,
      ourProbability: predictions.asianHandicap.home.probability,
      fairOdd: calculateFairOdd(predictions.asianHandicap.home.probability),
      marketOdd: odds.asianHandicap.home,
      hasValue: predictions.asianHandicap.home.hasValue,
    },
    {
      key: "ah-away",
      market: `Hándicap Asiático ${odds.asianHandicap.line > 0 ? "+" : ""}${odds.asianHandicap.line}`,
      selection: match.awayTeam.name,
      ourProbability: predictions.asianHandicap.away.probability,
      fairOdd: calculateFairOdd(predictions.asianHandicap.away.probability),
      marketOdd: odds.asianHandicap.away,
      hasValue: predictions.asianHandicap.away.hasValue,
    },
  ];
}

function extractOddsMap(item: LiveAnalysedMatch): Record<LiveOddsKey, number> {
  const rows = buildMarketRows(item);
  return rows.reduce(
    (acc, row) => {
      acc[row.key] = row.marketOdd;
      return acc;
    },
    {} as Record<LiveOddsKey, number>,
  );
}

function compareOddsFlash(
  previous: Record<LiveOddsKey, number> | null,
  current: Record<LiveOddsKey, number>,
): LiveOddsFlashMap {
  if (!previous) {
    return {};
  }

  const flash: LiveOddsFlashMap = {};

  (Object.keys(current) as LiveOddsKey[]).forEach((key) => {
    const prev = previous[key];
    const now = current[key];

    if (prev === undefined || now === prev) {
      return;
    }

    flash[key] = now > prev ? "up" : "down";
  });

  return flash;
}

function formatKickoff(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function TodaySchedulePanel({ fixtures }: { fixtures: TodayFixtureSummary[] }) {
  if (fixtures.length === 0) {
    return null;
  }

  return (
    <section className="glass-panel p-5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Mundial 2026 — Partidos de hoy
      </h3>
      <div className="space-y-2">
        {fixtures.map((fixture) => (
          <div
            key={fixture.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-white">
                {fixture.homeTeam} vs {fixture.awayTeam}
              </p>
              <p className="text-xs text-slate-500">
                {formatKickoff(fixture.kickoff)} · {fixture.status}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-200">{fixture.score}</span>
              {fixture.isLive ? <LiveBadge /> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SetupNotice({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
      <p className="font-medium text-amber-200">{message}</p>
      <p className="mt-2 text-sm text-amber-100/80">
        Crea un archivo <code className="rounded bg-white/[0.03] px-1">.env.local</code> con tu clave
        de API-Football:
      </p>
      <pre className="mt-3 overflow-x-auto rounded-xl bg-black/20 p-4 text-sm text-slate-300">
        SPORTS_API_PRO_KEY=tu_clave_fapi_aqui
      </pre>
      <p className="mt-3 text-xs text-amber-100/60">
        Regístrate en{" "}
        <a
          href="https://sportsapipro.com"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          sportsapipro.com
        </a>
      </p>
    </div>
  );
}

function formatUpdatedAt(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}

function StatBar({
  label,
  home,
  away,
  suffix = "",
}: {
  label: string;
  home: number;
  away: number;
  suffix?: string;
}) {
  const total = home + away || 1;
  const homePercent = (home / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-200">
          {home}
          {suffix}
        </span>
        <span className="text-xs uppercase tracking-wider text-slate-500">{label}</span>
        <span className="font-medium text-slate-200">
          {away}
          {suffix}
        </span>
      </div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="bg-cyan-500 transition-all duration-700 ease-out"
          style={{ width: `${homePercent}%` }}
        />
        <div
          className="bg-amber-500 transition-all duration-700 ease-out"
          style={{ width: `${100 - homePercent}%` }}
        />
      </div>
    </div>
  );
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-400">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
      </span>
      En vivo
    </span>
  );
}

function ValueBadge({ hasValue }: { hasValue: boolean }) {
  if (!hasValue) {
    return (
      <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs text-slate-500">
        —
      </span>
    );
  }

  return (
    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
      Valor
    </span>
  );
}

function MatchCard({
  item,
  isSelected,
  onSelect,
}: {
  item: LiveAnalysedMatch;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { match } = item;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border p-4 text-left transition-all ${
        isSelected
          ? "border-red-500/50 bg-red-500/10 shadow-lg shadow-red-500/10"
          : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.05]"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <LiveBadge />
        <span className="rounded-lg bg-white/[0.06] px-2 py-0.5 text-sm font-bold text-white">
          {match.minute}&apos;
        </span>
      </div>

      <p className="mb-1 text-xs text-slate-500">{match.league.name}</p>

      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-sm font-medium text-slate-200">
          {match.homeTeam.name}
        </span>
        <span className="shrink-0 text-lg font-black text-white">
          {match.score.home} - {match.score.away}
        </span>
        <span className="truncate text-right text-sm font-medium text-slate-200">
          {match.awayTeam.name}
        </span>
      </div>
    </button>
  );
}

function MatchDetail({ item, flashMap }: { item: LiveAnalysedMatch; flashMap: LiveOddsFlashMap }) {
  const { match, odds, predictions } = item;
  const marketRows = buildMarketRows(item);
  const valueCount = marketRows.filter((row) => row.hasValue).length;

  return (
    <div className="space-y-6">
      <header className="glass-panel p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <LiveBadge />
            <span className="rounded-lg bg-white/[0.06] px-3 py-1 text-sm font-bold text-white">
              {match.minute}&apos; · {match.period}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Actualizado: {formatUpdatedAt(item.updatedAt)}
          </p>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <p className="text-lg font-bold text-white">{match.homeTeam.name}</p>
          <p className="text-4xl font-black text-white">
            {match.score.home} - {match.score.away}
          </p>
          <p className="text-right text-lg font-bold text-white">{match.awayTeam.name}</p>
        </div>

        <p className="mt-3 text-center text-sm text-slate-400">
          {match.league.name} · {predictions.remainingMinutes} min restantes estimados
        </p>
      </header>

      <section className="glass-panel p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Estadísticas en vivo
        </h3>
        <div className="space-y-5">
          <StatBar label="Goles" home={match.score.home} away={match.score.away} />
          <StatBar label="Córners" home={match.corners.home} away={match.corners.away} />
          <StatBar
            label="Tarjetas amarillas"
            home={match.cards.homeYellow}
            away={match.cards.awayYellow}
          />
        </div>
      </section>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
        <p className="text-sm font-medium text-amber-200">
          ⚠️ Para Hándicaps Asiáticos en vivo, el marcador se considera 0-0 desde el
          momento de realizar la apuesta. Los goles previos no cuentan para el hándicap.
        </p>
        <p className="mt-2 text-xs text-amber-200/70">
          Contexto actual: marcador virtual{" "}
          <strong>
            {odds.asianHandicap.userContextScore.home}-
            {odds.asianHandicap.userContextScore.away}
          </strong>{" "}
          capturado en el minuto{" "}
          <strong>{odds.asianHandicap.userContextScore.capturedAtMinute}&apos;</strong>.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-white/[0.06]">
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-black/20 px-5 py-4">
          <div>
            <h3 className="font-bold text-white">Cuotas en vivo · {odds.bookmaker}</h3>
            <p className="text-xs text-slate-500">
              Actualizadas desde Bet365 cada {LIVE_POLL_INTERVAL_MS / 1000}s según cambios del mercado
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-slate-500">Valor detectado</p>
            <p className="text-xl font-bold text-emerald-400">{valueCount}</p>
          </div>
        </div>

        <div className="hidden grid-cols-[1.1fr_1fr_0.7fr_0.7fr_0.7fr_0.6fr] gap-3 bg-white/[0.03] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 md:grid">
          <span>Mercado</span>
          <span>Selección</span>
          <span>Nuestra prob.</span>
          <span>Cuota justa</span>
          <span>Cuota Bet365</span>
          <span>Valor</span>
        </div>

        <div className="divide-y divide-slate-800">
          {marketRows.map((row) => {
            const flash = flashMap[row.key];
            const flashClass =
              flash === "up"
                ? "animate-flash-up"
                : flash === "down"
                  ? "animate-flash-down"
                  : "";

            return (
              <article
                key={row.key}
                className={`grid grid-cols-1 gap-2 px-5 py-4 transition-colors md:grid-cols-[1.1fr_1fr_0.7fr_0.7fr_0.7fr_0.6fr] md:items-center md:gap-3 ${
                  row.hasValue ? "bg-emerald-500/5" : "bg-white/[0.03]"
                } ${flashClass}`}
              >
                <p className="text-sm text-white">{row.market}</p>
                <p className="text-sm text-slate-300">{row.selection}</p>
                <p className="text-sm font-semibold text-cyan-300">{row.ourProbability}%</p>
                <p className="text-sm text-slate-200">{row.fairOdd}</p>
                <p
                  className={`text-sm font-bold ${
                    flash === "up"
                      ? "text-emerald-300"
                      : flash === "down"
                        ? "text-red-400"
                        : "text-amber-300"
                  }`}
                >
                  {row.marketOdd}
                </p>
                <ValueBadge hasValue={row.hasValue} />
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function LiveDashboard() {
  const [matches, setMatches] = useState<LiveAnalysedMatch[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<TodayFixtureSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [flashMap, setFlashMap] = useState<LiveOddsFlashMap>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [planNotice, setPlanNotice] = useState<string | null>(null);
  const [tournament, setTournament] = useState("FIFA World Cup");
  const [oddsBookmaker, setOddsBookmaker] = useState("Bet365");

  const previousOddsRef = useRef<Record<string, Record<LiveOddsKey, number>>>({});
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  const selectedMatch = useMemo(
    () => matches.find((item) => item.match.id === selectedId) ?? matches[0] ?? null,
    [matches, selectedId],
  );

  const refreshLiveData = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/live", { cache: "no-store" });
      const payload = (await response.json()) as LiveApiResponse;

      setTodaySchedule(payload.todaySchedule ?? []);
      setTournament(payload.meta.tournament ?? "FIFA World Cup");
      setOddsBookmaker(payload.meta.oddsBookmaker ?? "Bet365");
      setPlanNotice(payload.meta.planNotice ?? null);
      setApiError(payload.meta.error ?? null);

      const updated = payload.matches ?? [];

      const nextFlash: LiveOddsFlashMap = {};

      updated.forEach((item) => {
        const currentOdds = extractOddsMap(item);
        const previousOdds = previousOddsRef.current[item.match.id] ?? null;
        const itemFlash = compareOddsFlash(previousOdds, currentOdds);

        Object.assign(nextFlash, itemFlash);
        previousOddsRef.current[item.match.id] = currentOdds;
      });

      setMatches(updated);

      const currentSelectedId = selectedIdRef.current;

      if (!currentSelectedId && updated[0]) {
        setSelectedId(updated[0].match.id);
      } else if (
        currentSelectedId &&
        updated.length > 0 &&
        !updated.some((item) => item.match.id === currentSelectedId)
      ) {
        setSelectedId(updated[0].match.id);
      }

      setFlashMap(nextFlash);
      setLastSync(payload.meta.updatedAt ?? new Date().toISOString());

      if (Object.keys(nextFlash).length > 0) {
        window.setTimeout(() => setFlashMap({}), 1200);
      }
    } catch {
      setApiError("No se pudo conectar con el servicio de partidos en vivo.");
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    matches.forEach((item) => {
      if (!previousOddsRef.current[item.match.id]) {
        previousOddsRef.current[item.match.id] = extractOddsMap(item);
      }
    });
  }, [matches]);

  useEffect(() => {
    void refreshLiveData();

    const intervalId = window.setInterval(() => {
      void refreshLiveData();
    }, LIVE_POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [refreshLiveData]);

  if (isLoading) {
    return (
      <div className="glass-panel p-10 text-center">
        <p className="text-slate-400">Cargando partidos del Mundial en vivo...</p>
      </div>
    );
  }

  if (apiError && matches.length === 0) {
    return (
      <div className="space-y-4">
        <SetupNotice message={apiError} />
        <TodaySchedulePanel fixtures={todaySchedule} />
      </div>
    );
  }

  if (!selectedMatch) {
    return (
      <div className="space-y-4">
        <div className="glass-panel p-10 text-center">
          <p className="text-lg font-medium text-slate-300">
            No hay partidos del {tournament} en directo ahora mismo.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Los datos se actualizan automáticamente cada {LIVE_POLL_INTERVAL_MS / 1000} segundos.
          </p>
        </div>
        <TodaySchedulePanel fixtures={todaySchedule} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {planNotice ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
          {planNotice}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 glass-panel px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Sincronización SportsAPI Pro</p>
          <p className="text-sm text-slate-300">
            {tournament} · Cuotas {oddsBookmaker} · Polling cada {LIVE_POLL_INTERVAL_MS / 1000}s
            {lastSync ? ` · Última sync: ${formatUpdatedAt(lastSync)}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshLiveData()}
          disabled={isRefreshing}
          className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:opacity-50"
        >
          {isRefreshing ? "Actualizando..." : "Actualizar ahora"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-3">
          <h2 className="px-1 text-sm font-semibold uppercase tracking-wider text-slate-500">
            {tournament} en directo ({matches.length})
          </h2>
          {matches.map((item) => (
            <MatchCard
              key={item.match.id}
              item={item}
              isSelected={item.match.id === selectedMatch.match.id}
              onSelect={() => setSelectedId(item.match.id)}
            />
          ))}
        </aside>

        <main className="space-y-4">
          <MatchDetail item={selectedMatch} flashMap={flashMap} />
          <TodaySchedulePanel fixtures={todaySchedule} />
        </main>
      </div>
    </div>
  );
}

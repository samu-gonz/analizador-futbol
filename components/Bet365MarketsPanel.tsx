"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { ValueCombinadaPanel } from "@/components/ValueCombinadaPanel";
import { formatValueEdge, type ValueEdgeTier } from "@/lib/valueBetting";
import type { AnalysedMatch } from "@/types/football";
import type { Bet365MarketsPayload, Bet365MarketsTab } from "@/types/bet365Markets";
import type { ValueCombinada } from "@/types/combinada";

const COMBINADA_TAB_ID = "combinada";

interface Bet365MarketsPanelProps {
  analysedMatch: AnalysedMatch;
  marketsPayload: Bet365MarketsPayload;
  oddsApiConfigured?: boolean;
  combinadas?: ValueCombinada[];
}

const COLUMN_TOOLTIPS = {
  cuota:
    "Multiplicador de Bet365. Si apuestas 10€, cobras 10€ × Cuota (beneficio neto + tu stake).",
  implied:
    "La probabilidad que estima Bet365 para este resultado según su cuota.",
  model:
    "La probabilidad real calculada por nuestro algoritmo inteligente (Poisson + datos del partido).",
  edge:
    "El beneficio estimado a largo plazo. A mayor porcentaje, mejor es la apuesta.",
} as const;

function InfoIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="currentColor"
    >
      <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM7.25 7h1.5v4.5h-1.5V7Zm0-2.25h1.5V6h-1.5V4.75Z" />
    </svg>
  );
}

function ColumnInfoHeader({
  label,
  tooltip,
  align = "left",
}: {
  label: string;
  tooltip: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <span
      className={`group relative inline-flex items-center gap-1.5 ${
        align === "right" ? "justify-end" : ""
      }`}
    >
      <span>{label}</span>
      <button
        type="button"
        aria-label={`Información sobre ${label}`}
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) {
            setOpen(false);
          }
        }}
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-600/80 bg-slate-800/80 text-slate-400 transition hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
      >
        <InfoIcon />
      </button>

      <span
        id={tooltipId}
        role="tooltip"
        className={`pointer-events-none absolute top-full z-20 mt-2 w-52 rounded-lg border border-white/10 bg-slate-900/95 px-3 py-2.5 text-[11px] font-normal normal-case leading-relaxed tracking-normal text-slate-200 shadow-xl shadow-black/40 backdrop-blur-sm transition ${
          align === "right" ? "right-0" : "left-0"
        } ${
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-1 opacity-0 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
        }`}
      >
        {tooltip}
      </span>
    </span>
  );
}

const VALUE_BADGE_STYLES: Record<
  ValueEdgeTier,
  string
> = {
  high: "border-emerald-300/50 bg-gradient-to-r from-emerald-500/25 to-lime-400/20 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.25)]",
  good: "border-sky-400/35 bg-gradient-to-r from-sky-500/20 to-emerald-500/15 text-sky-100",
  none: "border-slate-600/60 bg-slate-800/80 text-slate-400",
  avoid: "border-red-400/25 bg-red-500/10 text-red-300/90",
};

function ValueBadge({ valuePercent }: { valuePercent: number }) {
  const edge = formatValueEdge(valuePercent);

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-tight ${VALUE_BADGE_STYLES[edge.tier]}`}
    >
      {edge.label}
    </span>
  );
}

function rowHighlightClass(tier: ValueEdgeTier): string {
  if (tier === "high") {
    return "bg-emerald-500/[0.09] hover:bg-emerald-500/[0.12] ring-1 ring-inset ring-emerald-400/10";
  }

  if (tier === "good") {
    return "bg-sky-500/[0.06] hover:bg-sky-500/[0.09] ring-1 ring-inset ring-sky-400/10";
  }

  if (tier === "avoid") {
    return "bg-red-500/[0.04] hover:bg-red-500/[0.06]";
  }

  return "hover:bg-white/[0.02]";
}

function MarketAccordion({
  marketName,
  selections,
  defaultOpen,
}: {
  marketName: string;
  selections: Bet365MarketsPayload["tabs"][number]["groups"][number]["selections"];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d1117]/60">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-white/[0.04]"
      >
        <div>
          <p className="text-sm font-semibold text-white">{marketName}</p>
          <p className="text-xs text-slate-500">{selections.length} selecciones</p>
        </div>
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-md border border-white/10 text-sm text-slate-400 transition ${open ? "bg-white/10" : ""}`}
        >
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="border-t border-white/[0.06]">
          <div className="hidden grid-cols-[1.4fr_0.7fr_0.8fr_0.8fr_1fr] gap-3 bg-white/[0.03] px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 lg:grid">
            <span>Selección</span>
            <ColumnInfoHeader label="Cuota" tooltip={COLUMN_TOOLTIPS.cuota} />
            <ColumnInfoHeader
              label="Prob. impl."
              tooltip={COLUMN_TOOLTIPS.implied}
            />
            <ColumnInfoHeader
              label="Prob. modelo"
              tooltip={COLUMN_TOOLTIPS.model}
            />
            <ColumnInfoHeader
              label="Ventaja"
              tooltip={COLUMN_TOOLTIPS.edge}
              align="right"
            />
          </div>

          <div className="divide-y divide-white/[0.04]">
            {selections.map((selection) => {
              const edge = formatValueEdge(selection.valuePercent);

              return (
                <article
                  key={selection.id}
                  className={`px-3 py-3 transition-colors sm:px-4 sm:py-3.5 lg:grid lg:grid-cols-[1.4fr_0.7fr_0.8fr_0.8fr_1fr] lg:items-center lg:gap-3 ${rowHighlightClass(edge.tier)}`}
                >
                  <p className="mb-3 text-sm font-medium leading-snug text-slate-100 lg:mb-0">
                    {selection.selectionName}
                  </p>

                  <div className="grid grid-cols-2 gap-2 lg:contents">
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 lg:border-0 lg:bg-transparent lg:p-0">
                      <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 lg:hidden">
                        Cuota
                      </p>
                      <p className="font-display text-lg font-bold tabular-nums text-amber-400 lg:text-base">
                        {selection.decimalOdd.toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 lg:border-0 lg:bg-transparent lg:p-0">
                      <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 lg:hidden">
                        Prob. impl.
                      </p>
                      <p className="text-sm tabular-nums text-slate-400">
                        {selection.impliedProbability}%
                      </p>
                    </div>

                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 lg:border-0 lg:bg-transparent lg:p-0">
                      <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 lg:hidden">
                        Prob. modelo
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-cyan-300">
                        {selection.estimatedProbability}%
                      </p>
                    </div>

                    <div className="col-span-2 flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 lg:col-span-1 lg:justify-end lg:border-0 lg:bg-transparent lg:p-0">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 lg:hidden">
                        Ventaja
                      </p>
                      <ValueBadge valuePercent={selection.valuePercent} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TabPanel({ tab, panelKey }: { tab: Bet365MarketsTab; panelKey: string }) {
  return (
    <div className="space-y-3">
      {tab.groups.map((group, index) => (
        <MarketAccordion
          key={`${panelKey}-${group.marketKey}`}
          marketName={group.marketName}
          selections={group.selections}
          defaultOpen={index === 0}
        />
      ))}
    </div>
  );
}

export function Bet365MarketsPanel({
  analysedMatch,
  marketsPayload,
  oddsApiConfigured = false,
  combinadas = [],
}: Bet365MarketsPanelProps) {
  const { match } = analysedMatch;
  const [activeTab, setActiveTab] = useState<string>(
    marketsPayload.tabs[0]?.id ?? COMBINADA_TAB_ID,
  );

  useEffect(() => {
    if (marketsPayload.tabs.length > 0) {
      setActiveTab(marketsPayload.tabs[0].id);
    }
  }, [marketsPayload, match.id]);

  const activeTabData = useMemo(
    () =>
      marketsPayload.tabs.find((tab) => tab.id === activeTab) ??
      marketsPayload.tabs[0],
    [activeTab, marketsPayload],
  );

  const isCombinadaTab = activeTab === COMBINADA_TAB_ID;

  const sourceLabel =
    marketsPayload.source === "the-odds-api"
      ? `Cuotas reales · ${marketsPayload.bookmakerTitle}`
      : `Cuotas estimadas · ${marketsPayload.bookmakerTitle}`;

  return (
    <section className="glass-panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-white/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold text-white sm:text-lg">
            Mercados de apuestas
          </h2>
          <p className="truncate text-xs text-slate-500 sm:text-sm">{sourceLabel}</p>
        </div>

        {marketsPayload.tabs.length > 0 && (
          <div className="stat-card shrink-0 self-start sm:self-auto sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-[11px]">
              Con valor
            </p>
            <p className="font-display text-xl font-black text-emerald-400 sm:text-2xl">
              {marketsPayload.valueBetsCount}
            </p>
          </div>
        )}
      </div>

      {!oddsApiConfigured && (
        <div className="border-b border-amber-500/20 bg-amber-500/10 px-5 py-3 text-xs text-amber-200">
          Para cuotas reales Bet365 (incl. goleadores y jugadores), añade{" "}
          <strong>THE_ODDS_API_KEY</strong> en .env.local. Registro gratuito en{" "}
          <a
            href="https://the-odds-api.com"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            the-odds-api.com
          </a>{" "}
          (500 créditos/mes gratis).
        </div>
      )}

      {marketsPayload.message && marketsPayload.tabs.length > 0 && (
        <p className="border-b border-white/[0.06] px-5 py-2 text-xs text-amber-400/90">
          {marketsPayload.message}
        </p>
      )}

      <div className="relative border-b border-white/[0.06]">
        <div className="schedule-scroll flex gap-2 overflow-x-auto px-4 py-3 scroll-smooth md:flex-wrap md:overflow-x-visible">
          <button
            type="button"
            onClick={() => setActiveTab(COMBINADA_TAB_ID)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              isCombinadaTab
                ? "chip-active"
                : "border border-emerald-500/35 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15"
            }`}
          >
            Combinada
            <span
              className={`ml-1.5 text-xs ${isCombinadaTab ? "text-emerald-950/70" : "text-emerald-300/80"}`}
            >
              ({combinadas.length})
            </span>
          </button>

          {marketsPayload.tabs.length > 0 && (
            <span
              aria-hidden
              className="mx-0.5 hidden h-6 w-px shrink-0 self-center bg-white/10 sm:block"
            />
          )}

          {marketsPayload.tabs.map((tab) => {
            const isActive = !isCombinadaTab && tab.id === activeTabData?.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive ? "chip-active" : "chip-inactive"
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 text-xs ${isActive ? "text-emerald-950/70" : "text-slate-500"}`}
                >
                  ({tab.groups.length})
                </span>
              </button>
            );
          })}
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#0a0e14] via-[#0a0e14]/80 to-transparent md:hidden"
        />
      </div>

      <div className="max-h-none overflow-y-auto overscroll-contain p-3 sm:max-h-[720px] sm:p-4">
        {isCombinadaTab ? (
          <ValueCombinadaPanel
            embedded
            combinadas={combinadas}
            title="Combinadas de este partido"
            subtitle={`Apuestas múltiples con valor en ${match.homeTeam.name} vs ${match.awayTeam.name}.`}
            emptyMessage="No hay combinadas viables en este partido (mín. 2 piernas con valor y ≥22% de prob. cada una)."
          />
        ) : marketsPayload.tabs.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            {marketsPayload.message ?? "No hay mercados disponibles."}
          </p>
        ) : activeTabData ? (
          <TabPanel tab={activeTabData} panelKey={match.id} />
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">
            No hay mercados en esta categoría.
          </p>
        )}
      </div>

      {(marketsPayload.tabs.length > 0 || isCombinadaTab) && (
        <div className="border-t border-white/[0.06] px-5 py-3 text-xs text-slate-500">
          {isCombinadaTab ? (
            <>
              {combinadas.length} combinada{combinadas.length === 1 ? "" : "s"} con
              valor · piernas de todos los mercados del partido
            </>
          ) : (
            <>
              {marketsPayload.fetchedMarkets} mercados ·{" "}
              {marketsPayload.totalSelections} selecciones
              {marketsPayload.sportKey ? ` · ${marketsPayload.sportKey}` : ""}
            </>
          )}
        </div>
      )}
    </section>
  );
}

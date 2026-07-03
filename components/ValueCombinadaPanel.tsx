"use client";

import {
  formatCombinadaEdge,
  formatHitFrequency,
  getProbabilityTone,
  tierBorderClass,
} from "@/lib/combinada/combinadaScoring";
import type { ValueCombinada } from "@/types/combinada";

interface ValueCombinadaPanelProps {
  combinadas: ValueCombinada[];
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  /** Sin contenedor glass: para pestaña dentro del panel de mercados. */
  embedded?: boolean;
}

function formatKickoff(dateIso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(new Date(dateIso));
}

function CombinadaCard({
  combinada,
  rank,
}: {
  combinada: ValueCombinada;
  rank: number;
}) {
  const edge = formatCombinadaEdge(
    combinada.combinedValuePercent,
    combinada.combinedModelProbability,
    combinada.legs.length,
  );
  const probTone = getProbabilityTone(
    combinada.combinedModelProbability,
    combinada.legs.length,
  );
  const hitFrequency = formatHitFrequency(combinada.combinedModelProbability);

  return (
    <article className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] bg-white/[0.03] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-xs font-black text-emerald-300">
            #{rank}
          </span>
          <div>
            <p className="text-sm font-semibold text-white">
              Combinada · {combinada.legs.length} selecciones
            </p>
            <p className="text-xs text-slate-500">
              Cuota total{" "}
              <span className="font-bold text-amber-400">
                {combinada.combinedOdd.toFixed(2)}
              </span>
            </p>
          </div>
        </div>

        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tierBorderClass(edge.tier)}`}
        >
          {edge.label}
        </span>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {combinada.legs.map((leg) => (
          <div key={`${combinada.id}-${leg.marketKey}-${leg.selectionName}`} className="px-4 py-3">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-400">{leg.matchLabel}</p>
              <p className="text-[10px] tabular-nums text-slate-500">
                {formatKickoff(leg.kickoffIso)}
              </p>
            </div>
            <p className="text-sm font-medium text-white">{leg.selectionName}</p>
            <p className="text-xs text-slate-500">{leg.marketName}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              <span>
                Cuota{" "}
                <strong className="text-amber-400">{leg.decimalOdd.toFixed(2)}</strong>
              </span>
              <span>
                Modelo <strong className="text-cyan-300">{leg.estimatedProbability}%</strong>
              </span>
              <span>
                Ventaja <strong className="text-emerald-300">+{leg.valuePercent.toFixed(1)}%</strong>
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] bg-emerald-500/[0.04] px-4 py-3 text-xs">
        <div className="space-y-1">
          <p className="text-slate-400">
            Prob. de acertar todo:{" "}
            <strong
              className={
                probTone === "strong"
                  ? "text-emerald-300"
                  : probTone === "moderate"
                    ? "text-cyan-300"
                    : "text-amber-300"
              }
            >
              {combinada.combinedModelProbability}%
            </strong>
          </p>
          <p className="text-[11px] text-slate-500">{hitFrequency}</p>
        </div>
        <span className="text-slate-300">
          10€ → <strong className="text-amber-400">{combinada.stakeReturn10.toFixed(2)}€</strong>
        </span>
      </div>
    </article>
  );
}

export function ValueCombinadaPanel({
  combinadas,
  title = "Combinadas con valor",
  subtitle = "Sugerencias ordenadas por viabilidad: ventaja del modelo y probabilidad real de acertar todas las piernas.",
  emptyMessage = "No hay combinadas viables ahora. Buscamos cuotas totales entre 3 y 12 (ideal ~4–6) con piernas sólidas (cuota ≤3.2).",
  embedded = false,
}: ValueCombinadaPanelProps) {
  const body =
    combinadas.length === 0 ? (
      <p className="px-1 py-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </p>
    ) : (
      <div className="space-y-3">
        {combinadas.map((combinada, index) => (
          <CombinadaCard key={combinada.id} combinada={combinada} rank={index + 1} />
        ))}
      </div>
    );

  const footer = (
      <p className="text-[11px] leading-relaxed text-slate-500">
        Cuota total entre 3 y 12 (priorizamos ~4–6). Cada pierna ≤3.2 y ≥25% de
        probabilidad según el modelo. Sin locuras de cuota mil.
      </p>
  );

  if (embedded) {
    return (
      <div>
        <div className="mb-4">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        {body}
        <div className="mt-4 border-t border-white/[0.06] pt-3">{footer}</div>
      </div>
    );
  }

  return (
    <section className="glass-panel overflow-hidden">
      <div className="border-b border-white/[0.06] px-4 py-4 sm:px-5">
        <h2 className="font-display text-base font-bold text-white sm:text-lg">
          {title}
        </h2>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">{subtitle}</p>
      </div>

      {combinadas.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-slate-500 sm:px-5">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-3 p-3 sm:p-4">
          {combinadas.map((combinada, index) => (
            <CombinadaCard key={combinada.id} combinada={combinada} rank={index + 1} />
          ))}
        </div>
      )}

      <p className="border-t border-white/[0.06] px-4 py-3 text-[11px] leading-relaxed text-slate-500 sm:px-5">
        Cuota total entre 3 y 12 (priorizamos ~4–6). Cada pierna ≤3.2 y ≥25% de
        probabilidad según el modelo. Sin locuras de cuota mil.
      </p>
    </section>
  );
}

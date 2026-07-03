interface Bet365MarketsSkeletonProps {
  oddsApiConfigured?: boolean;
}

export function Bet365MarketsSkeleton({
  oddsApiConfigured = false,
}: Bet365MarketsSkeletonProps) {
  return (
    <section className="glass-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
        <div>
          <h2 className="font-display text-lg font-bold text-white">
            Mercados Bet365
          </h2>
          <p className="text-sm text-slate-500">
            {oddsApiConfigured
              ? "Cargando cuotas reales Bet365..."
              : "Cargando mercados estimados..."}
          </p>
        </div>
        <div className="stat-card h-14 w-24 skeleton-shimmer" />
      </div>

      <div className="flex gap-2 border-b border-white/[0.06] px-4 py-3">
        <div className="skeleton-shimmer h-9 w-28 shrink-0 rounded-full" />
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="skeleton-shimmer h-9 w-24 shrink-0 rounded-full"
          />
        ))}
      </div>

      <div className="space-y-3 p-4">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="skeleton-shimmer h-14 rounded-xl" />
        ))}
      </div>
    </section>
  );
}

import type { StandingsGroup } from "@/types/standings";

interface StandingsBoardProps {
  groups: StandingsGroup[];
}

function TeamCell({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl?: string;
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={name} className="h-5 w-5 object-contain" />
        ) : (
          <span className="text-[9px] font-bold text-slate-300">{initials}</span>
        )}
      </div>
      <span className="truncate text-sm font-medium text-slate-100">{name}</span>
    </div>
  );
}

function GroupTable({ group }: { group: StandingsGroup }) {
  return (
    <section className="glass-panel overflow-hidden">
      <header className="border-b border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider text-emerald-400">
          {group.name}
        </h2>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2.5 font-semibold">#</th>
              <th className="px-3 py-2.5 font-semibold">Equipo</th>
              <th className="px-2 py-2.5 text-center font-semibold">PJ</th>
              <th className="px-2 py-2.5 text-center font-semibold">G</th>
              <th className="px-2 py-2.5 text-center font-semibold">E</th>
              <th className="px-2 py-2.5 text-center font-semibold">P</th>
              <th className="px-2 py-2.5 text-center font-semibold">DG</th>
              <th className="px-3 py-2.5 text-center font-semibold">Pts</th>
            </tr>
          </thead>
          <tbody>
            {group.rows.map((row) => (
              <tr
                key={row.teamId}
                className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.02] ${
                  row.position <= 2 ? "bg-emerald-500/[0.05]" : ""
                }`}
              >
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded text-xs font-bold ${
                      row.position <= 2
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "text-slate-500"
                    }`}
                  >
                    {row.position}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <TeamCell name={row.teamName} logoUrl={row.logoUrl} />
                </td>
                <td className="px-2 py-2.5 text-center text-slate-400">
                  {row.played}
                </td>
                <td className="px-2 py-2.5 text-center text-slate-400">
                  {row.won}
                </td>
                <td className="px-2 py-2.5 text-center text-slate-400">
                  {row.drawn}
                </td>
                <td className="px-2 py-2.5 text-center text-slate-400">
                  {row.lost}
                </td>
                <td className="px-2 py-2.5 text-center text-slate-400">
                  {row.goalDifference > 0
                    ? `+${row.goalDifference}`
                    : row.goalDifference}
                </td>
                <td className="px-3 py-2.5 text-center font-display font-bold text-white">
                  {row.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function StandingsBoard({ groups }: StandingsBoardProps) {
  if (groups.length === 0) {
    return (
      <section className="glass-panel p-8 text-center">
        <p className="text-slate-400">
          No hay datos de clasificación disponibles en este momento.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => (
        <GroupTable key={group.id} group={group} />
      ))}
    </div>
  );
}

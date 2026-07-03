import Link from "next/link";

type AppNavActive = "analysis" | "live" | "standings";

interface AppNavProps {
  active?: AppNavActive;
}

const links: { id: AppNavActive; href: string; label: string; shortLabel: string }[] = [
  { id: "analysis", href: "/", label: "Análisis", shortLabel: "Análisis" },
  { id: "live", href: "/live", label: "En Vivo", shortLabel: "Vivo" },
  { id: "standings", href: "/clasificacion", label: "Clasificación", shortLabel: "Grupos" },
];

export function AppNav({ active }: AppNavProps) {
  return (
    <nav className="schedule-scroll flex shrink-0 items-center gap-0.5 overflow-x-auto rounded-xl border border-white/[0.08] bg-white/[0.04] p-0.5 sm:gap-1 sm:p-1">
      {links.map((link) => {
        const isActive = active === link.id;

        return (
          <Link
            key={link.id}
            href={link.href}
            className={`shrink-0 rounded-lg px-2 py-1.5 text-[11px] font-medium transition sm:px-4 sm:py-2 sm:text-sm ${
              isActive
                ? link.id === "live"
                  ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/20"
                  : "chip-active"
                : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <span className="sm:hidden">{link.shortLabel}</span>
            <span className="hidden sm:inline">{link.label}</span>
            {link.id === "live" && isActive && (
              <span className="ml-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

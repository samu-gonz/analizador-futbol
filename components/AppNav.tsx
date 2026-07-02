import Link from "next/link";

type AppNavActive = "analysis" | "live" | "standings";

interface AppNavProps {
  active?: AppNavActive;
}

const links: { id: AppNavActive; href: string; label: string }[] = [
  { id: "analysis", href: "/", label: "Análisis" },
  { id: "live", href: "/live", label: "En Vivo" },
  { id: "standings", href: "/clasificacion", label: "Clasificación" },
];

export function AppNav({ active }: AppNavProps) {
  return (
    <nav className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.04] p-1">
      {links.map((link) => {
        const isActive = active === link.id;

        return (
          <Link
            key={link.id}
            href={link.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition md:px-4 md:py-2 ${
              isActive
                ? link.id === "live"
                  ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/20"
                  : "chip-active"
                : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            {link.label}
            {link.id === "live" && isActive && (
              <span className="ml-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StandingsBoard } from "@/components/StandingsBoard";
import { isSportsApiProConfigured } from "@/lib/sportsApiPro/config";
import { getWorldCupStandings } from "@/services/worldCupStandingsService";

export const dynamic = "force-dynamic";

export default async function StandingsPage() {
  if (!isSportsApiProConfigured()) {
    return (
      <AppShell active="standings">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="glass-panel max-w-md p-8 text-center">
            <p className="text-slate-400">
              Configura SPORTS_API_PRO_KEY en .env.local para ver la
              clasificación del Mundial.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  let groups;

  try {
    groups = await getWorldCupStandings();
  } catch {
    return (
      <AppShell active="standings">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="glass-panel max-w-md p-8 text-center">
            <p className="text-slate-400">
              No se pudo cargar la clasificación del Mundial.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell active="standings">
      <PageHeader
        eyebrow="FIFA World Cup 2026"
        title="Clasificación por grupos"
        description="Tablas actualizadas de los 12 grupos del Mundial. Los dos primeros de cada grupo avanzan a dieciseisavos."
      />

      <StandingsBoard groups={groups} />
    </AppShell>
  );
}

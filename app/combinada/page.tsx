import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ValueCombinadaPanel } from "@/components/ValueCombinadaPanel";
import {
  getSortedDayKeys,
  groupMatchesByDay,
  resolveSelectedDay,
} from "@/lib/matchDates";
import { isSportsApiProConfigured } from "@/lib/sportsApiPro/config";
import { getAnalysedMatches } from "@/services/predictionEngine";
import { getValueCombinadasForMatches } from "@/services/combinadaService";
import { getWorldCupAnalysedMatches } from "@/services/worldCupAnalysisService";

export const dynamic = "force-dynamic";

interface CombinadaPageProps {
  searchParams: Promise<{ date?: string }>;
}

async function loadAnalysedMatches() {
  if (isSportsApiProConfigured()) {
    return getWorldCupAnalysedMatches();
  }

  return getAnalysedMatches();
}

export default async function CombinadaPage({ searchParams }: CombinadaPageProps) {
  const params = await searchParams;
  let analysedMatches;

  try {
    analysedMatches = await loadAnalysedMatches();
  } catch {
    return (
      <AppShell active="combinada">
        <div className="glass-panel p-8 text-center text-slate-400">
          No se pudieron cargar los partidos para generar combinadas.
        </div>
      </AppShell>
    );
  }

  const matchesByDay = groupMatchesByDay(analysedMatches);
  const dayKeys = getSortedDayKeys(matchesByDay);
  const selectedDate = resolveSelectedDay(dayKeys, matchesByDay, params.date);

  if (!selectedDate) {
    return (
      <AppShell active="combinada">
        <PageHeader
          eyebrow="Value Acca"
          title="Combinadas con valor"
          description="Apuestas múltiples sugeridas por nuestro modelo cuando la cuota combinada ofrece ventaja."
        />
        <ValueCombinadaPanel combinadas={[]} />
      </AppShell>
    );
  }

  const dayMatches = matchesByDay[selectedDate] ?? [];
  const combinadas = await getValueCombinadasForMatches(dayMatches, {
    maxMatches: 10,
  });

  return (
    <AppShell active="combinada">
      <PageHeader
        eyebrow="Value Acca"
        title="Combinadas con valor"
        description="Cruza selecciones del día con ventaja y probabilidad razonable. Ordenadas por viabilidad, no solo por cuota alta."
      />

      <ValueCombinadaPanel
        combinadas={combinadas}
        subtitle={`Sugerencias para el ${new Intl.DateTimeFormat("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
          timeZone: "Europe/Madrid",
        }).format(new Date(`${selectedDate}T12:00:00`))} · ${dayMatches.length} partidos analizados.`}
        emptyMessage="Hoy no hay combinadas en rango 3–12. Prueba otros partidos o revisa el análisis individual."
      />
    </AppShell>
  );
}

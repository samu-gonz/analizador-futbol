import { AppShell } from "@/components/AppShell";
import { MatchAnalysis } from "@/components/MatchAnalysis";
import { MatchSchedule } from "@/components/MatchSchedule";
import { PageHeader } from "@/components/PageHeader";
import { isSportsApiProConfigured } from "@/lib/sportsApiPro/config";
import {
  getSortedDayKeys,
  groupMatchesByDay,
  resolveSelectedDay,
} from "@/lib/matchDates";
import { getAnalysedMatches } from "@/services/predictionEngine";
import { getWorldCupAnalysedMatches } from "@/services/worldCupAnalysisService";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{ match?: string; date?: string }>;
}

async function loadAnalysedMatches() {
  if (isSportsApiProConfigured()) {
    return getWorldCupAnalysedMatches();
  }

  return getAnalysedMatches();
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  let analysedMatches;

  try {
    analysedMatches = await loadAnalysedMatches();
  } catch {
    return (
      <AppShell active="analysis">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="glass-panel max-w-md p-8 text-center">
            <p className="text-slate-400">
              No se pudieron cargar los partidos del Mundial. Comprueba tu clave
              de SportsAPI Pro en .env.local y reinicia el servidor.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  const matchesByDay = groupMatchesByDay(analysedMatches);
  const dayKeys = getSortedDayKeys(matchesByDay);
  const selectedDate = resolveSelectedDay(
    dayKeys,
    matchesByDay,
    params.date,
    params.match,
  );

  if (!selectedDate) {
    return (
      <AppShell active="analysis">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="glass-panel max-w-md p-8 text-center">
            <p className="text-slate-400">
              No hay partidos del Mundial disponibles en este momento.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  const dayMatches = matchesByDay[selectedDate] ?? [];
  const featuredMatch =
    dayMatches.find((item) => item.match.id === params.match) ?? dayMatches[0];

  const dayOptions = dayKeys.map((date) => ({
    date,
    matchCount: matchesByDay[date]?.length ?? 0,
  }));

  return (
    <AppShell active="analysis">
      <PageHeader
        eyebrow="Value Betting Engine"
        title="Análisis predictivo del Mundial"
        description="Comparativa entre probabilidades Poisson y cuotas del mercado. Detecta apuestas con valor en tiempo real."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(300px,340px)_1fr] lg:items-start">
        <div className="flex max-h-[min(70vh,640px)] min-h-0 flex-col lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]">
          <MatchSchedule
            days={dayOptions}
            selectedDate={selectedDate}
            matches={dayMatches}
            selectedMatchId={featuredMatch?.match.id ?? ""}
          />
        </div>

        <div className="min-w-0">
          {featuredMatch ? (
            <MatchAnalysis analysedMatch={featuredMatch} />
          ) : (
            <section className="glass-panel flex min-h-[400px] items-center justify-center p-12">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <span className="text-2xl">⚽</span>
                </div>
                <p className="font-display text-lg font-semibold text-white">
                  Selecciona un partido
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Elige un encuentro del calendario para ver el análisis completo.
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}

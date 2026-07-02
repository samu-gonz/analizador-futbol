import type { AnalysedMatch } from "@/types/football";

const DISPLAY_TIME_ZONE = "Europe/Madrid";

export function getMatchDayKey(
  dateIso: string,
  timeZone = DISPLAY_TIME_ZONE,
): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(
    new Date(dateIso),
  );
}

export function groupMatchesByDay(
  matches: AnalysedMatch[],
  timeZone = DISPLAY_TIME_ZONE,
): Record<string, AnalysedMatch[]> {
  const grouped: Record<string, AnalysedMatch[]> = {};

  for (const item of matches) {
    const dayKey = getMatchDayKey(item.match.date, timeZone);

    if (!grouped[dayKey]) {
      grouped[dayKey] = [];
    }

    grouped[dayKey].push(item);
  }

  for (const dayKey of Object.keys(grouped)) {
    grouped[dayKey].sort(
      (a, b) =>
        new Date(a.match.date).getTime() - new Date(b.match.date).getTime(),
    );
  }

  return grouped;
}

export function getSortedDayKeys(
  matchesByDay: Record<string, AnalysedMatch[]>,
): string[] {
  return Object.keys(matchesByDay).sort();
}

export function formatMatchDayLabel(dayKey: string): string {
  const todayKey = getMatchDayKey(new Date().toISOString());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = getMatchDayKey(tomorrow.toISOString());

  if (dayKey === todayKey) {
    return "Hoy";
  }

  if (dayKey === tomorrowKey) {
    return "Mañana";
  }

  const date = new Date(`${dayKey}T12:00:00`);

  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(date);
}

export function formatMatchDaySubtitle(dayKey: string): string {
  const date = new Date(`${dayKey}T12:00:00`);

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(date);
}

export function buildScheduleQuery(date: string, matchId?: string): string {
  const params = new URLSearchParams({ date });

  if (matchId) {
    params.set("match", matchId);
  }

  return `/?${params.toString()}`;
}

export function getClosestDayKey(dayKeys: string[]): string {
  if (dayKeys.length === 0) {
    return "";
  }

  const todayKey = getMatchDayKey(new Date().toISOString());

  if (dayKeys.includes(todayKey)) {
    return todayKey;
  }

  const todayMs = new Date(`${todayKey}T12:00:00`).getTime();

  const futureDay = dayKeys.find((key) => {
    const dayMs = new Date(`${key}T12:00:00`).getTime();
    return dayMs >= todayMs;
  });

  if (futureDay) {
    return futureDay;
  }

  return dayKeys.reduce((closest, key) => {
    const closestDiff = Math.abs(
      new Date(`${closest}T12:00:00`).getTime() - todayMs,
    );
    const keyDiff = Math.abs(new Date(`${key}T12:00:00`).getTime() - todayMs);

    return keyDiff < closestDiff ? key : closest;
  });
}

export function resolveSelectedDay(
  dayKeys: string[],
  matchesByDay: Record<string, AnalysedMatch[]>,
  requestedDate?: string,
  requestedMatchId?: string,
): string | undefined {
  if (dayKeys.length === 0) {
    return undefined;
  }

  if (requestedDate && matchesByDay[requestedDate]) {
    return requestedDate;
  }

  if (requestedMatchId) {
    const matchDay = dayKeys.find((day) =>
      matchesByDay[day]?.some((item) => item.match.id === requestedMatchId),
    );

    if (matchDay) {
      return matchDay;
    }
  }

  const todayKey = getMatchDayKey(new Date().toISOString());

  if (matchesByDay[todayKey]) {
    return todayKey;
  }

  const closestDay = getClosestDayKey(dayKeys);

  return closestDay || dayKeys[0];
}

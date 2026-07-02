const TEAM_ALIASES: Record<string, string[]> = {
  usa: ["united states", "us", "u s a", "estados unidos"],
  "united states": ["usa", "us", "estados unidos"],
  england: ["inglaterra"],
  spain: ["espana", "españa"],
  germany: ["alemania", "deutschland"],
  france: ["francia"],
  italy: ["italia"],
  brazil: ["brasil"],
  mexico: ["méxico", "mexico"],
  "south korea": ["korea republic", "korea", "republic of korea", "corea del sur"],
  "korea republic": ["south korea", "korea", "corea del sur"],
  "cape verde": ["cabo verde"],
  "cabo verde": ["cape verde"],
  iran: ["ir iran", "iran"],
  "ir iran": ["iran"],
  "ivory coast": ["cote d ivoire", "côte d ivoire"],
  netherlands: ["holanda", "holland"],
  switzerland: ["suiza"],
  portugal: ["portugal"],
  croatia: ["croacia"],
  morocco: ["marruecos"],
  algeria: ["argelia"],
  egypt: ["egipto"],
  australia: ["australia"],
  argentina: ["argentina"],
  colombia: ["colombia"],
  ghana: ["ghana"],
  canada: ["canada"],
  paraguay: ["paraguay"],
  norway: ["noruega"],
  belgium: ["belgica", "bélgica"],
  austria: ["austria"],
};

export function normalizeTeamName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function expandTeamVariants(name: string): string[] {
  const normalized = normalizeTeamName(name);
  const variants = new Set<string>([normalized]);

  for (const [canonical, aliases] of Object.entries(TEAM_ALIASES)) {
    const all = [canonical, ...aliases.map(normalizeTeamName)];

    if (all.some((entry) => entry === normalized || entry.includes(normalized) || normalized.includes(entry))) {
      all.forEach((entry) => variants.add(entry));
    }
  }

  return Array.from(variants);
}

export function teamNamesMatch(left: string, right: string): boolean {
  const a = normalizeTeamName(left);
  const b = normalizeTeamName(right);

  if (!a || !b) {
    return false;
  }

  if (a === b || a.includes(b) || b.includes(a)) {
    return true;
  }

  const variantsA = expandTeamVariants(left);
  const variantsB = expandTeamVariants(right);

  for (const va of variantsA) {
    for (const vb of variantsB) {
      if (va === vb || va.includes(vb) || vb.includes(va)) {
        return true;
      }
    }
  }

  return false;
}

export function teamsMatchEvent(
  homeTeam: string,
  awayTeam: string,
  eventHome: string,
  eventAway: string,
): boolean {
  const direct =
    teamNamesMatch(homeTeam, eventHome) && teamNamesMatch(awayTeam, eventAway);

  const swapped =
    teamNamesMatch(homeTeam, eventAway) && teamNamesMatch(awayTeam, eventHome);

  return direct || swapped;
}

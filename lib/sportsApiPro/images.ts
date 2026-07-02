export function getCompetitorLogoUrl(
  competitorId: number,
  imageVersion?: number,
): string | undefined {
  if (!imageVersion) {
    return undefined;
  }

  return `https://v1.football.sportsapipro.com/images/competitors/${competitorId}?imageVersion=${imageVersion}`;
}

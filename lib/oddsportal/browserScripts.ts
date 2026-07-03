export const EXTRACT_CATEGORY_ROWS_SCRIPT = `
(() => {
  const selectors = __SELECTORS__;
  const marketType = __MARKET__;

  const clean = (value) => (value || "").replace(/\\s+/g, " ").trim();

  const collectOddTexts = (row) => {
    const containers = row.querySelectorAll(selectors.oddContainer);

    if (containers.length > 0) {
      return Array.from(containers)
        .map((node) => clean(node.textContent))
        .filter((text) => text.length > 0);
    }

    const fallbackCells = row.querySelectorAll(
      'p[class*="height-content"], a[class*="odds"], span[class*="odds"]',
    );

    return Array.from(fallbackCells)
      .map((node) => clean(node.textContent))
      .filter((text) => /^\\d+([.,]\\d+)?$/.test(text.replace(/\\s/g, "")));
  };

  const readParticipants = (row) => {
    const participantsRoot = row.querySelector(selectors.participants);

    if (participantsRoot) {
      const names = Array.from(participantsRoot.querySelectorAll("p"))
        .map((node) => clean(node.textContent))
        .filter(Boolean);

      if (names.length >= 2) {
        return names[0] + " vs " + names[1];
      }
    }

    return "";
  };

  const readDateTime = (row, inheritedDate) => {
    const dateHeader = row.querySelector(selectors.dateHeader);
    const date = clean(dateHeader && dateHeader.textContent) || inheritedDate;
    const time = clean(row.querySelector(selectors.timeItem) && row.querySelector(selectors.timeItem).textContent);

    if (date && time) {
      return date + " " + time;
    }

    return date || time || "";
  };

  const readMatchUrl = (row) => {
    const participantLink = row.querySelector(
      '[data-testid="event-participants"] a[href*="/h2h/"], [data-testid="event-participants"] a[href*="/match/"]',
    );

    if (participantLink) {
      return participantLink.href;
    }

    const links = Array.from(row.querySelectorAll('a[href*="/h2h/"]'));
    const matchLink = links.find((link) => !link.href.includes("/bookmaker/"));

    return matchLink ? matchLink.href : null;
  };

  const rows = Array.from(document.querySelectorAll(selectors.eventRow)).filter(
    (row) => !row.parentElement || !row.parentElement.closest(selectors.eventRow),
  );
  const results = [];
  let currentDate = "";

  for (const row of rows) {
    const dateHeader = row.querySelector(selectors.dateHeader);

    if (dateHeader) {
      currentDate = clean(dateHeader.textContent);
    }

    const match = readParticipants(row);

    if (!match) {
      continue;
    }

    const time = clean(row.querySelector(selectors.timeItem) && row.querySelector(selectors.timeItem).textContent);
    const rowText = clean(row.textContent).toLowerCase();

    if (
      time === "FIN" ||
      time === "FT" ||
      time === "Postp." ||
      time === "FINISHED" ||
      rowText.includes("finalizado")
    ) {
      continue;
    }

    const oddTexts = collectOddTexts(row);
    const hasNumericOdds = oddTexts.some((text) => /^\\d+([.,]\\d+)?$/.test(text.replace(/\\s/g, "")));

    if (marketType === "totals" && oddTexts.length < 2 && !hasNumericOdds) {
      results.push({
        match,
        dateTime: readDateTime(row, currentDate),
        oddTexts: [],
        matchUrl: readMatchUrl(row),
      });
      continue;
    }

    if (marketType === "1x2" && oddTexts.length < 3 && !hasNumericOdds) {
      results.push({
        match,
        dateTime: readDateTime(row, currentDate),
        oddTexts: [],
        matchUrl: readMatchUrl(row),
      });
      continue;
    }

    results.push({
      match,
      dateTime: readDateTime(row, currentDate),
      oddTexts,
      matchUrl: readMatchUrl(row),
    });
  }

  return results;
})()
`;

export const EXTRACT_BET365_MATCH_SCRIPT = `
(() => {
  const marketType = __MARKET__;

  const clean = (value) => (value || "").replace(/\\s+/g, " ").trim();

  const participantsRoot = document.querySelector('[data-testid="event-participants"]');
  let match = "";

  if (participantsRoot) {
    const names = Array.from(participantsRoot.querySelectorAll("p"))
      .map((node) => clean(node.textContent))
      .filter(Boolean);

    if (names.length >= 2) {
      match = names[0] + " vs " + names[1];
    }
  }

  if (!match) {
    const heading = document.querySelector("h1");
    const headingText = clean(heading && heading.textContent);
    match = headingText.split(" - ")[0].replace(/\\s+-\\s+/g, " vs ");
  }

  const dateParts = [];
  const dateNode = document.querySelector('[data-testid="date-header"], time, .date');
  const timeNode = document.querySelector('[data-testid="time-item"]');

  if (dateNode) dateParts.push(clean(dateNode.textContent));
  if (timeNode) dateParts.push(clean(timeNode.textContent));

  const dateTime = dateParts.join(" ").trim();

  const bookmakerRows = Array.from(
    document.querySelectorAll('div[provider-name], [data-testid="bookmaker-item"]'),
  ).filter((row) => row.innerText.toLowerCase().includes("bet365"));

  let oddTexts = [];

  for (const row of bookmakerRows) {
    const regexMatches = (row.innerText.match(/\\b\\d+(?:[.,]\\d{1,2})?\\b/g) || [])
      .map((value) => value.replace(",", "."))
      .filter((value) => {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) && parsed > 1.01;
      });

    if (regexMatches.length >= (marketType === "totals" ? 2 : 3)) {
      oddTexts = regexMatches.slice(0, marketType === "totals" ? 2 : 3);
      break;
    }

    const values = Array.from(
      row.querySelectorAll('[data-testid="odd-container-default"]'),
    )
      .map((node) => clean(node.textContent))
      .filter((text) => /^\\d+([.,]\\d+)?$/.test(text.replace(/\\s/g, "")));

    if (values.length >= (marketType === "totals" ? 2 : 3)) {
      oddTexts = values.slice(0, marketType === "totals" ? 2 : 3);
      break;
    }
  }

  return {
    match,
    dateTime,
    oddTexts,
  };
})()
`;

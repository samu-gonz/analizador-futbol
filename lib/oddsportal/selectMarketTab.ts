import type { Page } from "puppeteer";
import type { OddsMarket } from "./types";

const MARKET_TAB_LABELS: Record<OddsMarket, string[]> = {
  "1x2": ["1X2", "1x2", "Home/Draw/Away"],
  totals: ["Over/Under", "Más/Menos", "Total Goals", "O/U"],
};

export async function selectMarketTab(
  page: Page,
  market: OddsMarket,
): Promise<void> {
  const script = `
    (() => {
      const tabLabels = ${JSON.stringify(MARKET_TAB_LABELS[market])};
      const nodes = Array.from(document.querySelectorAll("a, button, li, span, div"));

      for (const label of tabLabels) {
        const tab = nodes.find(
          (node) => (node.textContent || "").trim().toLowerCase() === label.toLowerCase(),
        );

        if (tab) {
          tab.click();
          return true;
        }
      }

      return false;
    })()
  `;

  await page.evaluate(script);
  await new Promise((resolve) => setTimeout(resolve, 1_500));
}

import puppeteer, { type Browser, type Page } from "puppeteer";
import {
  DEFAULT_VIEWPORT,
  RESIDENTIAL_USER_AGENT,
} from "./constants";
import type { BrowserLaunchOptions } from "./types";
import { setupRequestInterception } from "./interceptRequests";

const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-blink-features=AutomationControlled",
  "--disable-infobars",
  "--window-size=1280,800",
] as const;

export async function launchBrowser(
  options: BrowserLaunchOptions = {},
): Promise<Browser> {
  const browser = await puppeteer.launch({
    // Puppeteer 24+: `true` = nuevo modo headless (equivalente al antiguo "new").
    headless: options.headful ? false : true,
    args: [...LAUNCH_ARGS],
    defaultViewport: DEFAULT_VIEWPORT,
  });

  return browser;
}

export async function preparePage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();

  await page.setUserAgent(RESIDENTIAL_USER_AGENT);
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-GB,en;q=0.9",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  });

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });
  });

  await setupRequestInterception(page);

  return page;
}

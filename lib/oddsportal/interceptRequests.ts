import type { HTTPRequest, Page } from "puppeteer";
import { BLOCKED_RESOURCE_TYPES } from "./constants";

function shouldBlockRequest(request: HTTPRequest): boolean {
  const resourceType = request.resourceType();

  if (BLOCKED_RESOURCE_TYPES.has(resourceType)) {
    return true;
  }

  const url = request.url().toLowerCase();

  if (
    url.includes("google-analytics") ||
    url.includes("googletagmanager") ||
    url.includes("doubleclick") ||
    url.includes("facebook.net") ||
    url.endsWith(".mp4") ||
    url.endsWith(".webm")
  ) {
    return true;
  }

  return false;
}

export async function setupRequestInterception(page: Page): Promise<void> {
  await page.setRequestInterception(true);

  page.on("request", (request) => {
    if (shouldBlockRequest(request)) {
      void request.abort();
      return;
    }

    void request.continue();
  });
}

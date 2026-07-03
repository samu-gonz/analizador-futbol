/** User-Agent residencial moderno (Chrome en Windows). */
export const RESIDENTIAL_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export const DEFAULT_VIEWPORT = {
  width: 1280,
  height: 800,
} as const;

export const BLOCKED_RESOURCE_TYPES = new Set([
  "image",
  "media",
  "font",
]);

export const DEFAULT_TIMEOUT_MS = 45_000;

/** Selectores OddsPortal (Vue/Nuxt, pueden cambiar con rediseños). */
export const SELECTORS = {
  eventRow: 'div[class*="eventRow"], [data-testid="game-row"]',
  participants: '[data-testid="event-participants"]',
  timeItem: '[data-testid="time-item"]',
  dateHeader: '[data-testid="date-header"]',
  oddContainer:
    '[data-testid="odd-container-default"], [data-testid="odd-container-winning"]',
  cookieAccept: "#onetrust-accept-btn-handler, button.cookie-consent__accept",
  bookmakerFilter: 'a[href*="/bookmaker/bet365"], [data-bookmaker="bet365"]',
} as const;

export const BET365_BOOKMAKER_SLUG = "bet365";

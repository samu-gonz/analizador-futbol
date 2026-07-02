const SPORTS_API_PRO_BASE_URL =
  process.env.SPORTS_API_PRO_BASE_URL?.trim() || "https://api.sportsapipro.com/";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly apiErrors?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

type QueryParams = Record<string, string | number | boolean | undefined | null>;

export interface ApiGetOptions {
  params?: QueryParams;
}

function getApiKey(): string {
  const apiKey =
    process.env.SPORTS_API_PRO_KEY?.trim() ||
    process.env.API_FOOTBALL_KEY?.trim();

  if (!apiKey) {
    throw new ApiClientError(
      "SPORTS_API_PRO_KEY no está configurada. Añádela en .env.local",
    );
  }

  return apiKey;
}

function getBaseUrl(): string {
  const baseUrl = process.env.SPORTS_API_PRO_BASE_URL?.trim() || SPORTS_API_PRO_BASE_URL;
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

function buildRequestUrl(endpoint: string, params?: QueryParams): string {
  const normalizedEndpoint = endpoint.replace(/^\//, "");
  const url = new URL(normalizedEndpoint, getBaseUrl());

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

interface SapEnvelope<T> {
  success?: boolean;
  error?: string | { code?: string; message?: string };
  message?: string;
  data?: T;
}

function parseApiError(payload: SapEnvelope<unknown>): string | null {
  if (payload.success === false) {
    if (typeof payload.error === "string") {
      return payload.error;
    }

    if (payload.error && typeof payload.error === "object" && "message" in payload.error) {
      return String(payload.error.message);
    }

    if (payload.message) {
      return payload.message;
    }

    return "Error desconocido de SportsAPI Pro";
  }

  return null;
}

/**
 * Petición GET segura a SportsAPI Pro.
 *
 * - Base URL: https://api.sportsapipro.com/
 * - Autenticación: cabecera exclusiva `x-api-key`
 * - Sin cabeceras RapidAPI ni otras cabeceras automáticas
 */
export async function apiGet<TResponse>(
  endpoint: string,
  options: ApiGetOptions = {},
): Promise<TResponse> {
  const apiKey = getApiKey();
  const url = buildRequestUrl(endpoint, options.params);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiClientError(
      `SportsAPI Pro respondió con status ${response.status}`,
      response.status,
    );
  }

  const payload = (await response.json()) as SapEnvelope<TResponse> & TResponse;
  const apiErrorMessage = parseApiError(payload as SapEnvelope<unknown>);

  if (apiErrorMessage) {
    throw new ApiClientError(apiErrorMessage, response.status, payload);
  }

  return payload as TResponse;
}

export function getApiBaseUrl(): string {
  return getBaseUrl();
}

/** @deprecated Usa apiGet — mantenido por compatibilidad interna */
export const apiFootballGet = apiGet;
export { ApiClientError as ApiFootballClientError };

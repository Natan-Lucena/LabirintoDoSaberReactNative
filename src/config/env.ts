import Constants from "expo-constants";

export type AppEnvironment = "development" | "homologation" | "production";

export interface ApiEnvironmentInput {
  environment: AppEnvironment;
  apiBaseUrl?: string;
}

const appEnvironments: readonly AppEnvironment[] = [
  "development",
  "homologation",
  "production",
];

function isAppEnvironment(value: string): value is AppEnvironment {
  return appEnvironments.includes(value as AppEnvironment);
}

function getAppEnvironment(value: unknown): AppEnvironment {
  if (typeof value !== "string" || !isAppEnvironment(value)) {
    throw new Error(
      "EXPO_PUBLIC_APP_ENV must be development, homologation, or production.",
    );
  }

  return value;
}

export function getApiBaseUrl({
  environment,
  apiBaseUrl,
}: ApiEnvironmentInput): string {
  if (!apiBaseUrl?.trim()) {
    throw new Error("API base URL is required. Set EXPO_PUBLIC_API_BASE_URL.");
  }

  const baseUrl = apiBaseUrl.trim();
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(baseUrl);
  } catch {
    throw new Error("API base URL must be a valid HTTP or HTTPS URL.");
  }

  if (
    !parsedUrl.hostname ||
    (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:")
  ) {
    throw new Error("API base URL must be a valid HTTP or HTTPS URL.");
  }

  if (environment !== "development" && parsedUrl.protocol !== "https:") {
    throw new Error(
      "API base URL must use HTTPS outside the development environment.",
    );
  }

  return baseUrl;
}

export function getRuntimeApiBaseUrl(): string {
  const extra = Constants.expoConfig?.extra;

  return getApiBaseUrl({
    environment: getAppEnvironment(extra?.appEnvironment),
    apiBaseUrl:
      typeof extra?.apiBaseUrl === "string" ? extra.apiBaseUrl : undefined,
  });
}

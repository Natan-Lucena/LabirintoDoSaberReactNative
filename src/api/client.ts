import { AxiosHeaders, create, isAxiosError } from "axios";

import { getRuntimeApiBaseUrl } from "@/config/env";
import { normalizeApiError } from "@/api/errors";

const API_TIMEOUT_MS = 10_000;
const signInPath = "/educator/sign-in";

type TokenProvider = () => string | null;
type SessionExpiredListener = () => void;

let tokenProvider: TokenProvider = () => null;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

export const apiClient = create({
  baseURL: getRuntimeApiBaseUrl(),
  timeout: API_TIMEOUT_MS,
});

export function setTokenProvider(provider: TokenProvider): void {
  tokenProvider = provider;
}

export function subscribeSessionExpired(
  listener: SessionExpiredListener,
): () => void {
  sessionExpiredListeners.add(listener);

  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

function isSignInRequest(url?: string, method?: string): boolean {
  if (method?.toLowerCase() !== "post" || !url) {
    return false;
  }

  return new URL(url, apiClient.defaults.baseURL).pathname === signInPath;
}

apiClient.interceptors.request.use((config) => {
  const token = tokenProvider();

  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      isAxiosError(error) &&
      error.response?.status === 401 &&
      !isSignInRequest(error.config?.url, error.config?.method)
    ) {
      sessionExpiredListeners.forEach((listener) => listener());
    }

    return Promise.reject(normalizeApiError(error));
  },
);

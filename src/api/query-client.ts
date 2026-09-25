import { onlineManager, QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/api/errors";

const MAX_READ_RETRIES = 2;

function isClientError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status !== undefined &&
    error.status >= 400 &&
    error.status < 500
  );
}

function shouldRetryRead(failureCount: number, error: unknown): boolean {
  if (isClientError(error)) {
    return false;
  }
  return failureCount < MAX_READ_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetryRead,
        networkMode: "online",
      },
      mutations: {
        retry: false,
        networkMode: "always",
      },
    },
  });
}

export class OfflineError extends Error {
  constructor() {
    super("Sem conexão");
    this.name = "OfflineError";
  }
}

export function withOfflineGuard<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>,
): (variables: TVariables) => Promise<TData> {
  return (variables) => {
    if (!onlineManager.isOnline()) {
      return Promise.reject(new OfflineError());
    }
    return mutationFn(variables);
  };
}

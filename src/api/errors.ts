import { AxiosError, isAxiosError } from "axios";

export interface ApiFieldError {
  path: string;
  message: string;
}

interface ApiErrorResponse {
  message?: unknown;
  errors?: unknown;
}

export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly errors: readonly ApiFieldError[];
  readonly isNetworkError: boolean;
  readonly isTimeout: boolean;

  constructor({
    message,
    status,
    code,
    errors = [],
    isNetworkError = false,
    isTimeout = false,
  }: {
    message: string;
    status?: number;
    code?: string;
    errors?: readonly ApiFieldError[];
    isNetworkError?: boolean;
    isTimeout?: boolean;
  }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.isNetworkError = isNetworkError;
    this.isTimeout = isTimeout;
  }
}

function getFieldErrors(value: unknown): readonly ApiFieldError[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (error): error is ApiFieldError =>
      typeof error === "object" &&
      error !== null &&
      typeof error.path === "string" &&
      typeof error.message === "string",
  );
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (!isAxiosError(error)) {
    return new ApiError({
      message: error instanceof Error ? error.message : "Unexpected error",
    });
  }

  const response = error.response;
  const payload = (response?.data ?? {}) as ApiErrorResponse;
  const serverMessage =
    typeof payload.message === "string" ? payload.message : undefined;
  const isTimeout =
    error.code === AxiosError.ETIMEDOUT || error.code === "ECONNABORTED";
  const isNetworkError = !response && !isTimeout;

  return new ApiError({
    message: serverMessage ?? error.message,
    status: response?.status,
    code: serverMessage,
    errors: getFieldErrors(payload.errors),
    isNetworkError,
    isTimeout,
  });
}

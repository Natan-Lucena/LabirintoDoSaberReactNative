// Adaptador Axios customizado (sem dependência nova): resolve requisições
// contra o registro de src/mocks/handlers/registry.ts em vez de ir à rede.
import { AxiosError } from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";

import { getMockHandler } from "@/mocks/handlers/registry";
import { MockApiError, MockNetworkError } from "@/mocks/handlers/types";

function buildResponse<T>(
  config: InternalAxiosRequestConfig,
  status: number,
  data: T,
): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: String(status),
    headers: {},
    config,
  };
}

function buildApiErrorAxiosError(
  config: InternalAxiosRequestConfig,
  status: number,
  code: string,
  message: string,
): AxiosError {
  const response = buildResponse(config, status, { message: code });
  const error = new AxiosError(message, String(status), config, {}, response);

  return error;
}

function buildNetworkAxiosError(
  config: InternalAxiosRequestConfig,
): AxiosError {
  return new AxiosError(
    "MOCK_NETWORK_ERROR",
    AxiosError.ERR_NETWORK,
    config,
    {},
  );
}

export async function mockAdapter(
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse> {
  const method = (config.method ?? "get").toLowerCase();
  const url = new URL(config.url ?? "", config.baseURL ?? "http://mock.local");
  const handler = getMockHandler(method, url.pathname);

  if (!handler) {
    throw buildApiErrorAxiosError(
      config,
      404,
      "MOCK_ROUTE_NOT_FOUND",
      `No mock handler for ${method.toUpperCase()} ${url.pathname}`,
    );
  }

  const params = Object.fromEntries(url.searchParams.entries());

  try {
    const result = await handler({ body: config.data, params });

    return buildResponse(config, result.status, result.data);
  } catch (error) {
    if (error instanceof MockNetworkError) {
      throw buildNetworkAxiosError(config);
    }

    if (error instanceof MockApiError) {
      throw buildApiErrorAxiosError(
        config,
        error.status,
        error.code,
        error.message,
      );
    }

    throw error;
  }
}

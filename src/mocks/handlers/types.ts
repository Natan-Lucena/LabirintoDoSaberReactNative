export interface MockHandlerContext {
  body: unknown;
  params: Record<string, string>;
}

export interface MockHandlerSuccess {
  status: number;
  data: unknown;
}

/** Marcador reconhecido pelo adaptador: falha de rede (sem response). */
export class MockNetworkError extends Error {
  constructor() {
    super("MOCK_NETWORK_ERROR");
    this.name = "MockNetworkError";
  }
}

/** Falha de API com status/código conhecidos (ex.: 401 INVALID_CREDENTIALS). */
export class MockApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message?: string) {
    super(message ?? code);
    this.name = "MockApiError";
    this.status = status;
    this.code = code;
  }
}

export type MockHandler = (
  ctx: MockHandlerContext,
) => MockHandlerSuccess | Promise<MockHandlerSuccess>;

export interface MockRouteKey {
  method: "get" | "post" | "put" | "delete";
  path: string;
}

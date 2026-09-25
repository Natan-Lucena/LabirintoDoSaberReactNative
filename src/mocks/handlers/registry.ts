// Ponto único de extensão da camada de mocks (G-29): tarefas futuras
// registram novos handlers aqui em vez de recriar o adaptador.
import type { MockHandler, MockRouteKey } from "./types";

const handlers = new Map<string, MockHandler>();

function routeKey({ method, path }: MockRouteKey): string {
  return `${method} ${path}`;
}

export function registerMockHandler(
  key: MockRouteKey,
  handler: MockHandler,
): void {
  handlers.set(routeKey(key), handler);
}

export function getMockHandler(
  method: string,
  path: string,
): MockHandler | undefined {
  return handlers.get(
    routeKey({ method: method as MockRouteKey["method"], path }),
  );
}

export function clearMockHandlers(): void {
  handlers.clear();
}

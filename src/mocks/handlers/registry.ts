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

export function getMockHandlerMatch(
  method: string,
  path: string,
): { handler: MockHandler; params: Record<string, string> } | undefined {
  const exact = getMockHandler(method, path);
  if (exact) {
    return { handler: exact, params: {} };
  }

  const pathSegments = path.split("/");
  for (const [key, handler] of handlers) {
    const [registeredMethod, registeredPath] = key.split(" ");
    const registeredSegments = registeredPath.split("/");
    if (
      registeredMethod !== method ||
      registeredSegments.length !== pathSegments.length
    ) {
      continue;
    }

    const params: Record<string, string> = {};
    const matches = registeredSegments.every((segment, index) => {
      if (segment.startsWith(":")) {
        params[segment.slice(1)] = pathSegments[index];
        return true;
      }
      return segment === pathSegments[index];
    });
    if (matches) {
      return { handler, params };
    }
  }
}

export function clearMockHandlers(): void {
  handlers.clear();
}

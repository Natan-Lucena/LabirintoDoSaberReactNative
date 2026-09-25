// Estado mínimo em memória do mock de autenticação (não reimplementa a
// autenticação real): só o suficiente para GET /educator/me exigir um
// "login" mockado prévio.
let currentToken: string | null = null;

export function setMockSession(token: string): void {
  currentToken = token;
}

export function clearMockSession(): void {
  currentToken = null;
}

export function getMockSession(): string | null {
  return currentToken;
}

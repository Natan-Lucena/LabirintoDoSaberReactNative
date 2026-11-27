// Cenário da equipe (API-07, leva 2), mock-first. Por padrão o educador fictício
// NÃO tem clínica e a lista de pacientes não muda; os testes e o uso manual ligam
// o cenário com `setMockTeamScenario`.
export type MockTeamScenario = "none" | "admin" | "professional";

let scenario: MockTeamScenario = "none";

export function getMockTeamScenario(): MockTeamScenario {
  return scenario;
}

export function setMockTeamScenario(next: MockTeamScenario): void {
  scenario = next;
}

export function resetMockTeamScenario(): void {
  scenario = "none";
}

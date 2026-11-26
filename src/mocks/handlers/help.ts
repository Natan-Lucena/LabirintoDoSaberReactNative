// Central de ajuda (API-07, leva 4; CONTRATOS-BACKEND §6.7): tutoriais.
// Contrato PROPOSTO, mock-first.
import { MOCK_HELP_TUTORIALS } from "@/mocks/fixtures-e5";
import { registerMockHandler } from "./registry";

export type MockHelpScenario = "default" | "empty";

let scenario: MockHelpScenario = "default";

/** `"empty"` devolve `[]` (estado "ainda não foram publicados"). */
export function setMockHelpScenario(next: MockHelpScenario): void {
  scenario = next;
}

registerMockHandler({ method: "get", path: "/help/tutorials" }, () => ({
  status: 200,
  data: scenario === "empty" ? [] : structuredClone(MOCK_HELP_TUTORIALS),
}));

export const helpMockHandlersRegistered = true;

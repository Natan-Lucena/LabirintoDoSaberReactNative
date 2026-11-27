// Ponte entre os handlers de `register` (educator) e de convite (clinic), sem
// que o primeiro importe o segundo (que puxa o apiClient e o env no carregamento).
// `handlers/clinic.ts` registra as funções ao ser carregado (EQP-03).
import type { TeamRole } from "@/api/types";

export interface MockInviteGateway {
  isValid: (code: unknown) => boolean;
  consume: (code: unknown) => TeamRole;
}

let gateway: MockInviteGateway | null = null;

export function setMockInviteGateway(next: MockInviteGateway): void {
  gateway = next;
}

export function getMockInviteGateway(): MockInviteGateway {
  if (!gateway) {
    throw new Error("Handlers de convite do mock não foram carregados.");
  }
  return gateway;
}

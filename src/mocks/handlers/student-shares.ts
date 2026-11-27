// Paciente compartilhado (EQP-04; CONTRATOS-BACKEND §4.15 a §4.17). Contrato
// PROPOSTO, mock-first, com estado em memória (`mock-share-state`): compartilhar
// e remover mudam a lista devolvida. `GET` também vale para quem recebeu o
// compartilhamento (EQ-19).
import type { StudentShare } from "@/api/types";
import { MOCK_EDUCATOR } from "@/mocks/fixtures";
import { buildMockClinicMembers } from "@/mocks/fixtures-e5";
import {
  getMockShares,
  isMockMemberRemoved,
  setMockShares,
} from "@/mocks/mock-share-state";
import { getMockTeamScenario } from "@/mocks/mock-team-state";
import { registerMockHandler } from "./registry";
import { findMockAccessibleStudent } from "./student";
import { MockApiError } from "./types";

/** Paciente que quem lê pode ver; `owner` diz se ele é o dono. */
function accessFor(studentId: string): { owner: boolean } {
  const student = findMockAccessibleStudent(studentId);
  return { owner: student.access !== "SHARED" };
}

function requireOwner(studentId: string): void {
  if (!accessFor(studentId).owner) {
    throw new MockApiError(403, "UNAUTHORIZED");
  }
}

registerMockHandler(
  { method: "get", path: "/student/:id/shares" },
  ({ params }) => {
    const { owner } = accessFor(params.id);
    if (owner) {
      return { status: 200, data: getMockShares(params.id) };
    }
    // Compartilhado comigo: a lista (sem o dono) traz quem lê e os demais.
    const scenario = getMockTeamScenario();
    const me: StudentShare = {
      educatorId: MOCK_EDUCATOR.id,
      name: MOCK_EDUCATOR.name,
      role: scenario === "admin" ? "ADMIN" : "PROFESSIONAL",
      sharedAt: "2026-11-03T12:00:00.000Z",
    };
    return { status: 200, data: [me, ...getMockShares(params.id)] };
  },
);

registerMockHandler(
  { method: "post", path: "/student/:id/shares" },
  ({ params, body }) => {
    requireOwner(params.id);
    const educatorId = (body as { educatorId?: unknown } | null)?.educatorId;
    if (typeof educatorId !== "string" || educatorId === "") {
      throw new MockApiError(400, "VALIDATION_ERROR");
    }
    if (educatorId === MOCK_EDUCATOR.id) {
      throw new MockApiError(400, "VALIDATION_ERROR");
    }
    const scenario = getMockTeamScenario();
    const member =
      scenario === "none"
        ? undefined
        : buildMockClinicMembers(
            scenario === "admin" ? "ADMIN" : "PROFESSIONAL",
          )
            .filter((item) => !isMockMemberRemoved(item.educatorId))
            .find((item) => item.educatorId === educatorId);
    if (!member) {
      throw new MockApiError(400, "NOT_IN_SAME_CLINIC");
    }
    const current = getMockShares(params.id);
    // Idempotente: compartilhar de novo devolve a mesma lista.
    if (current.some((share) => share.educatorId === educatorId)) {
      return { status: 200, data: current };
    }
    const next: StudentShare = {
      educatorId: member.educatorId,
      name: member.name,
      role: member.role,
      sharedAt: new Date().toISOString(),
    };
    return { status: 200, data: setMockShares(params.id, [...current, next]) };
  },
);

registerMockHandler(
  { method: "delete", path: "/student/:id/shares/:educatorId" },
  ({ params }) => {
    requireOwner(params.id);
    const current = getMockShares(params.id);
    if (!current.some((share) => share.educatorId === params.educatorId)) {
      throw new MockApiError(404, "SHARE_NOT_FOUND");
    }
    return {
      status: 200,
      data: setMockShares(
        params.id,
        current.filter((share) => share.educatorId !== params.educatorId),
      ),
    };
  },
);

export const studentSharesMockHandlersRegistered = true;

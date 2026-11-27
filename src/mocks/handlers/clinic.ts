// Equipe (API-07, leva 2; CONTRATOS-BACKEND §4): leitura da clínica, dos convites
// ativos e da prévia pública. Contrato PROPOSTO, mock-first. O cenário vem de
// `mock-team-state` (padrão: sem clínica).
import { normalizeInviteCode } from "@/api/endpoints/clinic";
import type { ClinicInvite, ClinicView, TeamRole } from "@/api/types";
import {
  MOCK_CLINIC,
  MOCK_INVITE_CODE,
  MOCK_INVITE_RATE_LIMITED_CODE,
  buildMockClinicMembers,
} from "@/mocks/fixtures-e5";
import { MOCK_EDUCATOR } from "@/mocks/fixtures";
import { getMockTeamScenario } from "@/mocks/mock-team-state";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

const DAY_MS = 86_400_000;

/** "dd/mm" no fuso de São Paulo (EQ-17). */
function formatDayMonth(date: Date): string {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
  }).formatToParts(date);
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("day")}/${value("month")}`;
}

function buildInvite(
  id: string,
  code: string,
  role: TeamRole,
  createdAt: Date,
): ClinicInvite {
  const expiresAt = new Date(createdAt.getTime() + 7 * DAY_MS);
  return {
    id,
    code,
    role,
    createdBy: MOCK_EDUCATOR.id,
    expiresAt: expiresAt.toISOString(),
    shareMessage: `Use o código ${code} para entrar na equipe ${MOCK_CLINIC.name} no app Labirinto do Saber. Vale até ${formatDayMonth(expiresAt)}.`,
    createdAt: createdAt.toISOString(),
  };
}

/** Convites ativos, o mais novo primeiro; válidos por 7 dias a partir de "agora". */
function activeInvites(): ClinicInvite[] {
  const now = Date.now();
  return [
    buildInvite(
      "mock-invite-2",
      "KM4W9RTD",
      "ADMIN",
      new Date(now - 3_600_000),
    ),
    buildInvite(
      "mock-invite-1",
      MOCK_INVITE_CODE,
      "PROFESSIONAL",
      new Date(now - DAY_MS),
    ),
  ];
}

function requireClinic(): "ADMIN" | "PROFESSIONAL" {
  const scenario = getMockTeamScenario();
  if (scenario === "none") {
    throw new MockApiError(404, "NOT_IN_CLINIC");
  }
  return scenario === "admin" ? "ADMIN" : "PROFESSIONAL";
}

registerMockHandler({ method: "get", path: "/clinic/" }, () => {
  const myRole = requireClinic();
  const view: ClinicView = {
    clinic: { ...MOCK_CLINIC },
    myRole,
    members: buildMockClinicMembers(myRole),
  };
  return { status: 200, data: view };
});

registerMockHandler({ method: "get", path: "/clinic/invites" }, () => {
  const myRole = requireClinic();
  if (myRole !== "ADMIN") {
    throw new MockApiError(403, "FORBIDDEN_ROLE");
  }
  return { status: 200, data: activeInvites() };
});

registerMockHandler(
  { method: "get", path: "/clinic/invites/preview/:code" },
  ({ params }) => {
    const code = normalizeInviteCode(params.code ?? "");
    if (code === MOCK_INVITE_RATE_LIMITED_CODE) {
      throw new MockApiError(429, "TOO_MANY_REQUESTS");
    }
    const invite = activeInvites().find((item) => item.code === code);
    if (!invite) {
      throw new MockApiError(404, "INVITE_INVALID");
    }
    return {
      status: 200,
      data: {
        clinicName: MOCK_CLINIC.name,
        role: invite.role,
        expiresAt: invite.expiresAt,
      },
    };
  },
);

export const clinicMockHandlersRegistered = true;

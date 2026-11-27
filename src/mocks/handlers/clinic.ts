// Equipe (API-07, leva 2; CONTRATOS-BACKEND §4): leitura da clínica, dos convites
// ativos e da prévia pública. Contrato PROPOSTO, mock-first. O cenário vem de
// `mock-team-state` (padrão: sem clínica).
import { normalizeInviteCode } from "@/api/endpoints/clinic";
import type {
  ClinicInvite,
  ClinicMember,
  ClinicView,
  TeamRole,
} from "@/api/types";
import {
  MOCK_CLINIC,
  MOCK_INVITE_CODE,
  MOCK_INVITE_RATE_LIMITED_CODE,
  buildMockClinicMembers,
} from "@/mocks/fixtures-e5";
import { MOCK_EDUCATOR } from "@/mocks/fixtures";
import {
  getMockTeamScenario,
  setMockTeamScenario,
} from "@/mocks/mock-team-state";
import { setMockInviteGateway } from "@/mocks/mock-invite-state";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

const DAY_MS = 86_400_000;
const MAX_ACTIVE_INVITES = 20;

// Estado em memória das escritas (EQP-01): clínica criada pelo app e convites novos.
let createdClinic: ClinicView | null = null;
let createdInvites: ClinicInvite[] = [];
let inviteSeq = 0;
// Convites de uso único (EQ-06): consumidos pelo cadastro ou pelo accept.
let usedInviteCodes = new Set<string>();
// Gestão (EQP-02): nome novo, papéis alterados, membros removidos e convites revogados.
let renamedClinic: string | null = null;
let roleOverrides = new Map<string, TeamRole>();
let removedMembers = new Set<string>();
let revokedInviteIds = new Set<string>();

export function resetMockClinicState(): void {
  createdClinic = null;
  createdInvites = [];
  inviteSeq = 0;
  usedInviteCodes = new Set();
  resetManagementState();
}

function resetManagementState(): void {
  renamedClinic = null;
  roleOverrides = new Map();
  removedMembers = new Set();
  revokedInviteIds = new Set();
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Código fictício de 8 caracteres (A-Z e 2-9, sem 0, O, 1 e I). */
function nextInviteCode(): string {
  inviteSeq += 1;
  let code = "";
  let n = inviteSeq * 7919;
  for (let i = 0; i < 8; i += 1) {
    code += CODE_ALPHABET[(n + i * 5) % CODE_ALPHABET.length];
    n = Math.floor(n / 3) + 11 * (i + 1);
  }
  return code;
}

function clinicName(): string {
  return renamedClinic ?? createdClinic?.clinic.name ?? MOCK_CLINIC.name;
}

function sortMembers(members: ClinicMember[]): ClinicMember[] {
  // ADMIN primeiro, depois por nome (mesma ordem de `buildMockClinicMembers`).
  return members.sort((a, b) =>
    a.role !== b.role
      ? a.role === "ADMIN"
        ? -1
        : 1
      : a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
  );
}

/** Membros atuais: base do cenário + papéis alterados − removidos. */
function currentMembers(myRole: TeamRole): ClinicMember[] {
  const base = createdClinic
    ? createdClinic.members
    : buildMockClinicMembers(myRole);
  return sortMembers(
    base
      .filter((member) => !removedMembers.has(member.educatorId))
      .map((member) => {
        const override = roleOverrides.get(member.educatorId);
        return override && member.educatorId !== MOCK_EDUCATOR.id
          ? { ...member, role: override }
          : { ...member };
      }),
  );
}

function currentView(myRole: TeamRole): ClinicView {
  const clinic = createdClinic?.clinic ?? { ...MOCK_CLINIC };
  return {
    clinic: { ...clinic, name: clinicName() },
    myRole,
    members: currentMembers(myRole),
  };
}

function requireAdmin(): void {
  if (requireClinic() !== "ADMIN") {
    throw new MockApiError(403, "FORBIDDEN_ROLE");
  }
}

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
    shareMessage: `Use o código ${code} para entrar na equipe ${clinicName()} no app Labirinto do Saber. Vale até ${formatDayMonth(expiresAt)}.`,
    createdAt: createdAt.toISOString(),
  };
}

/** Convites ativos, o mais novo primeiro; válidos por 7 dias a partir de "agora". */
function activeInvites(): ClinicInvite[] {
  const now = Date.now();
  return [
    ...createdInvites,
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
  ].filter((invite) => !revokedInviteIds.has(invite.id));
}

function findActiveInvite(code: string): ClinicInvite | undefined {
  const normalized = normalizeInviteCode(code);
  if (usedInviteCodes.has(normalized)) return undefined;
  return activeInvites().find((item) => item.code === normalized);
}

/**
 * Consome o convite (uso único) e liga o cenário de equipe com o papel dele.
 * Usado pelo `accept` e pelo `register` com `inviteCode`. `INVITE_INVALID` se o
 * código não existe ou já foi usado.
 */
function consumeMockInvite(code: unknown): TeamRole {
  const invite = typeof code === "string" ? findActiveInvite(code) : undefined;
  if (!invite) {
    throw new MockApiError(404, "INVITE_INVALID");
  }
  usedInviteCodes.add(invite.code);
  setMockTeamScenario(invite.role === "ADMIN" ? "admin" : "professional");
  return invite.role;
}

/** O código existe e ainda não foi usado (sem consumi-lo). */
function isMockInviteValid(code: unknown): boolean {
  return typeof code === "string" && findActiveInvite(code) !== undefined;
}

setMockInviteGateway({
  isValid: isMockInviteValid,
  consume: consumeMockInvite,
});

function requireClinic(): "ADMIN" | "PROFESSIONAL" {
  const scenario = getMockTeamScenario();
  if (scenario === "none") {
    throw new MockApiError(404, "NOT_IN_CLINIC");
  }
  return scenario === "admin" ? "ADMIN" : "PROFESSIONAL";
}

registerMockHandler({ method: "get", path: "/clinic/" }, () => {
  return { status: 200, data: currentView(requireClinic()) };
});

registerMockHandler({ method: "get", path: "/clinic/invites" }, () => {
  const myRole = requireClinic();
  if (myRole !== "ADMIN") {
    throw new MockApiError(403, "FORBIDDEN_ROLE");
  }
  return { status: 200, data: activeInvites() };
});

registerMockHandler({ method: "put", path: "/clinic/" }, ({ body }) => {
  requireAdmin();
  const name =
    typeof (body as { name?: unknown } | null)?.name === "string"
      ? (body as { name: string }).name.trim()
      : "";
  if (name.length < 2 || name.length > 80) {
    throw new MockApiError(400, "VALIDATION_ERROR");
  }
  renamedClinic = name;
  return { status: 200, data: currentView("ADMIN") };
});

registerMockHandler(
  { method: "delete", path: "/clinic/invites/:id" },
  ({ params }) => {
    requireAdmin();
    const exists = activeInvites().some((item) => item.id === params.id);
    if (!exists) {
      throw new MockApiError(404, "INVITE_NOT_FOUND");
    }
    revokedInviteIds.add(params.id ?? "");
    return { status: 204, data: undefined };
  },
);

function adminCount(myRole: TeamRole): number {
  return currentMembers(myRole).filter((member) => member.role === "ADMIN")
    .length;
}

registerMockHandler(
  { method: "put", path: "/clinic/members/:educatorId" },
  ({ params, body }) => {
    requireAdmin();
    const role = (body as { role?: unknown } | null)?.role;
    if (role !== "ADMIN" && role !== "PROFESSIONAL") {
      throw new MockApiError(400, "VALIDATION_ERROR");
    }
    const target = currentMembers("ADMIN").find(
      (member) => member.educatorId === params.educatorId,
    );
    if (!target) {
      throw new MockApiError(404, "MEMBER_NOT_FOUND");
    }
    if (
      target.role === "ADMIN" &&
      role === "PROFESSIONAL" &&
      adminCount("ADMIN") <= 1
    ) {
      throw new MockApiError(409, "LAST_ADMIN");
    }
    if (target.educatorId === MOCK_EDUCATOR.id) {
      // Mudar o próprio papel muda o cenário: de ADMIN para PROFESSIONAL.
      setMockTeamScenario(role === "ADMIN" ? "admin" : "professional");
      return { status: 200, data: currentView(role) };
    }
    roleOverrides.set(target.educatorId, role);
    return { status: 200, data: currentView("ADMIN") };
  },
);

registerMockHandler(
  { method: "delete", path: "/clinic/members/:educatorId" },
  ({ params }) => {
    const myRole = requireClinic();
    const isSelf = params.educatorId === MOCK_EDUCATOR.id;
    if (!isSelf && myRole !== "ADMIN") {
      throw new MockApiError(403, "FORBIDDEN_ROLE");
    }
    const target = currentMembers(myRole).find(
      (member) => member.educatorId === params.educatorId,
    );
    if (!target) {
      throw new MockApiError(404, "MEMBER_NOT_FOUND");
    }
    if (target.role === "ADMIN" && adminCount(myRole) <= 1) {
      throw new MockApiError(409, "LAST_ADMIN");
    }
    if (isSelf) {
      // Sair da equipe: volta ao cenário "sem equipe".
      createdClinic = null;
      createdInvites = [];
      resetManagementState();
      setMockTeamScenario("none");
    } else {
      removedMembers.add(target.educatorId);
    }
    return { status: 204, data: undefined };
  },
);

registerMockHandler(
  { method: "get", path: "/clinic/invites/preview/:code" },
  ({ params }) => {
    const code = normalizeInviteCode(params.code ?? "");
    // LIMITE22 tem "I" (formato inválido no app): TENTAT22 chega à prévia.
    if (code === MOCK_INVITE_RATE_LIMITED_CODE || code === "TENTAT22") {
      throw new MockApiError(429, "TOO_MANY_REQUESTS");
    }
    const invite = findActiveInvite(code);
    if (!invite) {
      throw new MockApiError(404, "INVITE_INVALID");
    }
    return {
      status: 200,
      data: {
        clinicName: clinicName(),
        role: invite.role,
        expiresAt: invite.expiresAt,
      },
    };
  },
);

registerMockHandler({ method: "post", path: "/clinic/" }, ({ body }) => {
  const name =
    typeof (body as { name?: unknown } | null)?.name === "string"
      ? (body as { name: string }).name.trim()
      : "";
  if (name.length < 2 || name.length > 80) {
    throw new MockApiError(400, "VALIDATION_ERROR");
  }
  if (getMockTeamScenario() !== "none") {
    throw new MockApiError(409, "ALREADY_IN_CLINIC");
  }
  const joinedAt = new Date().toISOString();
  createdClinic = {
    clinic: { id: "mock-clinic-created", name, createdAt: joinedAt },
    myRole: "ADMIN",
    members: [
      {
        educatorId: MOCK_EDUCATOR.id,
        name: MOCK_EDUCATOR.name,
        email: MOCK_EDUCATOR.email,
        profession: MOCK_EDUCATOR.profession ?? undefined,
        role: "ADMIN",
        joinedAt,
      },
    ],
  };
  createdInvites = [];
  setMockTeamScenario("admin");
  return { status: 201, data: createdClinic };
});

registerMockHandler({ method: "post", path: "/clinic/invites" }, ({ body }) => {
  const myRole = requireClinic();
  if (myRole !== "ADMIN") {
    throw new MockApiError(403, "FORBIDDEN_ROLE");
  }
  const role = (body as { role?: unknown } | null)?.role;
  if (role !== "ADMIN" && role !== "PROFESSIONAL") {
    throw new MockApiError(400, "VALIDATION_ERROR");
  }
  if (activeInvites().length >= MAX_ACTIVE_INVITES) {
    throw new MockApiError(409, "TOO_MANY_INVITES");
  }
  const invite = buildInvite(
    `mock-invite-new-${inviteSeq + 1}`,
    nextInviteCode(),
    role,
    new Date(),
  );
  createdInvites = [invite, ...createdInvites];
  return { status: 201, data: invite };
});

registerMockHandler(
  { method: "post", path: "/clinic/invites/accept" },
  ({ body }) => {
    const code = (body as { code?: unknown } | null)?.code;
    if (typeof code !== "string" || code.trim() === "") {
      throw new MockApiError(400, "VALIDATION_ERROR");
    }
    if (getMockTeamScenario() !== "none") {
      throw new MockApiError(409, "ALREADY_IN_CLINIC");
    }
    const role = consumeMockInvite(code);
    const view: ClinicView = {
      clinic: createdClinic?.clinic ?? { ...MOCK_CLINIC },
      myRole: role,
      members: buildMockClinicMembers(role),
    };
    return { status: 200, data: view };
  },
);

export const clinicMockHandlersRegistered = true;

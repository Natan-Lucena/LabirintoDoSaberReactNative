// Equipe: leitura (API-07, leva 2). Contrato PROPOSTO em
// docs/entrega-5/CONTRATOS-BACKEND.md §2.3 e §4 (mock-first). Escritas (criar e
// renomear clínica, convites, papéis, compartilhar) entram com as telas EQP-*.
import { apiClient } from "@/api/client";
import { normalizeApiError } from "@/api/errors";
import type {
  ClinicInvite,
  ClinicView,
  InvitePreview,
  StudentShare,
  TeamRole,
} from "@/api/types";

/** EQ-16: maiúsculas, sem espaços e hífens (`"ab3k-7mpq"` = `"AB3K7MPQ"`). */
export function normalizeInviteCode(code: string): string {
  return code.replace(/[\s-]/g, "").toUpperCase();
}

export const clinicQueryKeys = {
  all: ["clinic"] as const,
  view: ["clinic", "view"] as const,
  invites: ["clinic", "invites"] as const,
  invitePreview: (code: string) =>
    ["clinic", "invite-preview", normalizeInviteCode(code)] as const,
  /** Sob o prefixo `student`: as invalidações de `["student"]` cobrem. */
  studentShares: (studentId: string) =>
    ["student", "shares", studentId] as const,
};

/** GET /clinic/ — `404 NOT_IN_CLINIC` sem clínica (estado vazio, não erro). */
export async function getClinic(): Promise<ClinicView> {
  try {
    const response = await apiClient.get<ClinicView>("/clinic/");
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

/** GET /clinic/invites — só ADMIN (`403 FORBIDDEN_ROLE`); ativos, o mais novo primeiro. */
export async function listClinicInvites(): Promise<ClinicInvite[]> {
  try {
    const response = await apiClient.get<ClinicInvite[]>("/clinic/invites");
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

/**
 * GET /clinic/invites/preview/:code — **pública** (antes do login); não consome o
 * convite. `404 INVITE_INVALID` e `429 TOO_MANY_REQUESTS` (10 por IP em 15 min).
 */
export async function getInvitePreview(code: string): Promise<InvitePreview> {
  try {
    const response = await apiClient.get<InvitePreview>(
      `/clinic/invites/preview/${encodeURIComponent(normalizeInviteCode(code))}`,
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

/** GET /student/:id/shares — quem tem acesso lê; a lista não traz o dono. */
export async function listStudentShares(
  studentId: string,
): Promise<StudentShare[]> {
  try {
    const response = await apiClient.get<StudentShare[]>(
      `/student/${encodeURIComponent(studentId)}/shares`,
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export interface CreateClinicInput {
  /** 2–80 caracteres depois do `trim`. */
  name: string;
}

/** POST /clinic/ — o criador vira ADMIN. `409 ALREADY_IN_CLINIC`. */
export async function createClinic(
  input: CreateClinicInput,
): Promise<ClinicView> {
  try {
    const response = await apiClient.post<ClinicView>("/clinic/", {
      name: input.name.trim(),
    });
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export interface CreateClinicInviteInput {
  role: TeamRole;
}

/** POST /clinic/invites — só ADMIN. `403 FORBIDDEN_ROLE`, `409 TOO_MANY_INVITES`. */
export async function createClinicInvite(
  input: CreateClinicInviteInput,
): Promise<ClinicInvite> {
  try {
    const response = await apiClient.post<ClinicInvite>("/clinic/invites", {
      role: input.role,
    });
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

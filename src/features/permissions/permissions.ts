import type { Educator, TeamRole } from "@/api/types";

export interface Permissions {
  role: TeamRole | null;
  inClinic: boolean;
  /** Criar convites, listar e revogar. */
  canInvite: boolean;
  /** Renomear a clínica, mudar papéis e remover membros. */
  canManageTeam: boolean;
  canLeaveTeam: boolean;
}

/**
 * Única fonte da regra "quem pode o quê" na equipe (EQP-02). É controle de
 * interface: a decisão final é do servidor (`403 FORBIDDEN_ROLE`). A regra por
 * paciente (dono) não entra aqui: é da EQP-04.
 */
export function permissionsFor(
  clinic?: Educator["clinic"] | null,
): Permissions {
  if (!clinic) {
    return {
      role: null,
      inClinic: false,
      canInvite: false,
      canManageTeam: false,
      canLeaveTeam: false,
    };
  }
  const admin = clinic.role === "ADMIN";
  return {
    role: clinic.role,
    inClinic: true,
    canInvite: admin,
    canManageTeam: admin,
    canLeaveTeam: true,
  };
}

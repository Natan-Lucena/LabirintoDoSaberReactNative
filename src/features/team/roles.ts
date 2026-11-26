import type { TeamRole } from "@/api/types";

/** Papéis da equipe em português, num só lugar (EQP-01 §6.8). */
export const TEAM_ROLE_LABEL: Record<TeamRole, string> = {
  ADMIN: "Administrador(a)",
  PROFESSIONAL: "Profissional",
};

export function teamRoleLabel(role: TeamRole): string {
  return TEAM_ROLE_LABEL[role];
}

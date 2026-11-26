import type { TeamRole } from "@/api/types";

/** Papéis da equipe em português, num só lugar (EQP-01 §6.8). */
export const TEAM_ROLE_LABEL: Record<TeamRole, string> = {
  ADMIN: "Administrador(a)",
  PROFESSIONAL: "Profissional",
};

export function teamRoleLabel(role: TeamRole): string {
  return TEAM_ROLE_LABEL[role];
}

/** "{profissão} · {papel}" com clínica; sem clínica, profissão ou e-mail (EQP-02). */
export function professionAndRole(educator: {
  profession?: string | null;
  email: string;
  clinic?: { role: TeamRole } | null;
}): string {
  const profession = educator.profession || undefined;
  if (!educator.clinic) {
    return profession ?? educator.email;
  }
  const role = teamRoleLabel(educator.clinic.role);
  return profession ? `${profession} · ${role}` : role;
}

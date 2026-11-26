import type { Student } from "@/api/types";

/**
 * Dono do cadastro (G-62, EQ-10/EQ-11): `access` ausente conta como dono, o que
 * mantém o app compatível com o backend de antes da leva 2. Nenhuma tela
 * compara `access` fora desta função. Não confundir com o papel na equipe
 * (`usePermissions`, EQP-02): ser ADMIN não torna ninguém dono do paciente.
 */
export function isPatientOwner(student: Pick<Student, "access">): boolean {
  return student.access !== "SHARED";
}

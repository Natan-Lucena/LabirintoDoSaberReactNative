// Paciente compartilhado (EQP-04). Contrato publicado em
// 2026-11-26 (BACKEND-ENTREGUE-E5 §3.3; CONTRATOS-BACKEND §4.15 a §4.17). A leitura
// (`listStudentShares`) nasceu na API-07 e fica em `clinic.ts`.
import { apiClient } from "@/api/client";
import { normalizeApiError } from "@/api/errors";
import type { StudentShare } from "@/api/types";

export { listStudentShares } from "@/api/endpoints/clinic";

/**
 * POST /student/:id/shares — só o dono; idempotente. `400 NOT_IN_SAME_CLINIC`,
 * `403 UNAUTHORIZED`, `404 STUDENT_NOT_FOUND`. Devolve a lista atualizada.
 */
export async function shareStudent(input: {
  studentId: string;
  educatorId: string;
}): Promise<StudentShare[]> {
  try {
    const response = await apiClient.post<StudentShare[]>(
      `/student/${encodeURIComponent(input.studentId)}/shares`,
      { educatorId: input.educatorId },
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

/**
 * DELETE /student/:id/shares/:educatorId — só o dono. `403 UNAUTHORIZED`,
 * `404 STUDENT_NOT_FOUND`, `404 SHARE_NOT_FOUND`. Devolve a lista atualizada.
 */
export async function unshareStudent(input: {
  studentId: string;
  educatorId: string;
}): Promise<StudentShare[]> {
  try {
    const response = await apiClient.delete<StudentShare[]>(
      `/student/${encodeURIComponent(input.studentId)}/shares/${encodeURIComponent(input.educatorId)}`,
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

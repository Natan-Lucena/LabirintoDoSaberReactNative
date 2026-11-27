// Status do paciente: leitura (API-07, leva 3). Contrato PROPOSTO em
// docs/entrega-5/CONTRATOS-BACKEND.md §2.4 e §5.2 a §5.4 (mock-first). A escrita
// (`PUT /student/:id/status`) entra com a tela PAC-10.
import { apiClient } from "@/api/client";
import { normalizeApiError } from "@/api/errors";
import { withQuery } from "@/api/endpoints/query";
import type {
  PatientOverview,
  Student,
  StudentStatus,
  StudentStatusFilter,
} from "@/api/types";

/** Prefixo `student`: as invalidações de `["student"]` cobrem. */
export const studentStatusQueryKeys = {
  list: (status: StudentStatusFilter = "ACTIVE") =>
    ["student", "status", status] as const,
  overview: (status: StudentStatusFilter = "ACTIVE") =>
    ["student", "overview", status] as const,
  detail: (studentId: string) => ["student", "detail", studentId] as const,
};

/** Ausente = ativo (PA-01): campo novo, o backend atual ainda não o manda. */
export function studentStatus(student: Pick<Student, "status">): StudentStatus {
  return student.status ?? "ACTIVE";
}

/** Ausente = próprio (EQ-13). */
export function isSharedStudent(student: Pick<Student, "access">): boolean {
  return student.access === "SHARED";
}

/** GET /student/?status= — padrão `ACTIVE`; valor fora do enum responde `400`. */
export async function listStudentsByStatus(
  status: StudentStatusFilter = "ACTIVE",
): Promise<Student[]> {
  try {
    const response = await apiClient.get<(Student & { educators?: unknown })[]>(
      withQuery("/student/", { status }),
    );
    return response.data.map(
      ({ educators: _educators, ...student }) => student,
    );
  } catch (error) {
    throw normalizeApiError(error);
  }
}

/** GET /student/overview?status= — um item por paciente de `GET /student/?status=`, na mesma ordem (PA-08). */
export async function listStudentOverview(
  status: StudentStatusFilter = "ACTIVE",
): Promise<PatientOverview[]> {
  try {
    const response = await apiClient.get<PatientOverview[]>(
      withQuery("/student/overview", { status }),
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

/** GET /student/:id (PP-09) — também para arquivado; `403 UNAUTHORIZED`, `404 STUDENT_NOT_FOUND`. */
export async function getStudent(studentId: string): Promise<Student> {
  try {
    const response = await apiClient.get<Student & { educators?: unknown }>(
      `/student/${encodeURIComponent(studentId)}`,
    );
    const { educators: _educators, ...student } = response.data;
    return student;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

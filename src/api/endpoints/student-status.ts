// Status do paciente: leitura (API-07, leva 3) e escrita (PAC-11). Contrato
// PROPOSTO em docs/entrega-5/CONTRATOS-BACKEND.md §2.4 e §5.2 a §5.4 (mock-first).
import { AxiosError } from "axios";

import { apiClient } from "@/api/client";
import { ApiError, normalizeApiError } from "@/api/errors";
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

/**
 * `409 HAS_FUTURE_APPOINTMENTS` ao arquivar (PA-10). O cliente HTTP normaliza só
 * `message`; o `count` (atendimentos `PENDING` futuros) é lido aqui.
 */
export class StudentStatusConflictError extends ApiError {
  readonly count?: number;

  constructor({
    count,
    ...rest
  }: ConstructorParameters<typeof ApiError>[0] & { count?: number }) {
    super(rest);
    this.name = "StudentStatusConflictError";
    this.count = count;
  }
}

export interface UpdateStudentStatusInput {
  status: StudentStatus;
  /** Só depois da confirmação explícita do usuário (AC-PAC-11-01). */
  cancelFutureAppointments?: boolean;
}

/**
 * PUT /student/:id/status — só o dono (`403`); `404 STUDENT_NOT_FOUND`;
 * `409 HAS_FUTURE_APPOINTMENTS` com `count` quando há futuros e a opção não veio.
 */
export async function updateStudentStatus(
  studentId: string,
  input: UpdateStudentStatusInput,
): Promise<Student> {
  try {
    const response = await apiClient.put<Student & { educators?: unknown }>(
      `/student/${encodeURIComponent(studentId)}/status`,
      input,
      {
        validateStatus: (status) =>
          (status >= 200 && status < 300) || status === 409,
      },
    );
    if (response.status === 409) {
      const body = (response.data ?? {}) as {
        message?: unknown;
        count?: unknown;
      };
      if (body.message === "HAS_FUTURE_APPOINTMENTS") {
        throw new StudentStatusConflictError({
          message:
            "Este paciente tem atendimentos futuros. Cancele-os ou escolha cancelar ao arquivar.",
          status: 409,
          code: "HAS_FUTURE_APPOINTMENTS",
          count: typeof body.count === "number" ? body.count : undefined,
        });
      }
      throw normalizeApiError(
        new AxiosError("Conflict", "409", response.config, null, response),
      );
    }
    const { educators: _educators, ...student } = response.data;
    return student;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

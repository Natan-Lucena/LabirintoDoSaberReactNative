// Estado em memória do status do paciente (PAC-11), mock-first: quem foi
// arquivado ou reativado nesta sessão do mock. Nada disto vai para a rede.
import type { Student, StudentStatus } from "@/api/types";
import { MOCK_ARCHIVED_STUDENT_ID } from "@/mocks/fixtures-e5";

interface StatusOverride {
  status: StudentStatus;
  archivedAt?: string;
}

let overrides = new Map<string, StatusOverride>();

export function resetMockStudentStatusState(): void {
  overrides = new Map();
}

export function setMockStudentStatus(
  studentId: string,
  status: StudentStatus,
): void {
  overrides.set(
    studentId,
    status === "ARCHIVED"
      ? { status, archivedAt: new Date().toISOString() }
      : { status },
  );
}

/** Aplica o arquivamento/reativação feito no mock sobre o paciente do fixture. */
export function applyMockStudentStatus(student: Student): Student {
  const override = overrides.get(student.id);
  if (!override) return student;
  const { archivedAt: _previous, ...rest } = student;
  return {
    ...rest,
    status: override.status,
    ...(override.archivedAt ? { archivedAt: override.archivedAt } : {}),
  };
}

/** Para handlers que só têm o id (ex.: criar atendimento, `409 STUDENT_ARCHIVED`). */
export function isMockStudentIdArchived(studentId: string): boolean {
  const override = overrides.get(studentId);
  return override
    ? override.status === "ARCHIVED"
    : studentId === MOCK_ARCHIVED_STUDENT_ID;
}

export function isMockStudentArchived(student: Student): boolean {
  return applyMockStudentStatus(student).status === "ARCHIVED";
}

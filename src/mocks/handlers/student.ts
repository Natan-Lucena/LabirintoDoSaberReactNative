import type { Student, StudentStatusFilter } from "@/api/types";
import {
  MOCK_ARCHIVED_STUDENT,
  MOCK_COLLEAGUE_ID,
  MOCK_SHARED_STUDENT,
} from "@/mocks/fixtures-e5";
import { MOCK_STUDENTS } from "@/mocks/fixtures";
import { isMockMemberRemoved } from "@/mocks/mock-share-state";
import {
  applyMockStudentStatus,
  isMockStudentArchived,
} from "@/mocks/mock-student-status-state";
import { getMockTeamScenario } from "@/mocks/mock-team-state";
import { MOCK_FOREIGN_STUDENT_ID } from "./plans";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

const STATUS_FILTERS: StudentStatusFilter[] = ["ACTIVE", "ARCHIVED", "ALL"];

/** Próprio e ativo, com os campos novos explícitos (EQ-13, PA-01). */
function decorate(student: Student): Student {
  return { access: "OWNER", status: "ACTIVE", ...student };
}

/** O compartilhado só existe com equipe e enquanto o dono segue nela (EQ-09). */
function sharedWithMe(): Student[] {
  return getMockTeamScenario() === "none" ||
    isMockMemberRemoved(MOCK_COLLEAGUE_ID)
    ? []
    : [MOCK_SHARED_STUDENT];
}

/**
 * Pacientes visíveis para o filtro, na ordem de `GET /student/` (compartilhado
 * depois dos próprios). O compartilhado só existe com o cenário de equipe ligado.
 */
export function listMockStudents(status: StudentStatusFilter): Student[] {
  // Arquivar/reativar no mock (PAC-11) move o paciente entre as duas listas.
  const all: Student[] = [
    ...MOCK_STUDENTS.map(decorate),
    ...sharedWithMe(),
    MOCK_ARCHIVED_STUDENT,
  ].map(applyMockStudentStatus);
  const active = all.filter((student) => student.status !== "ARCHIVED");
  const archived = all.filter((student) => student.status === "ARCHIVED");

  if (status === "ARCHIVED") return archived;
  if (status === "ALL") return [...active, ...archived];
  return active;
}

export function parseStatusFilter(
  value: string | undefined,
): StudentStatusFilter {
  if (value === undefined) return "ACTIVE";
  if (!STATUS_FILTERS.includes(value as StudentStatusFilter)) {
    throw new MockApiError(400, "Bad Request");
  }
  return value as StudentStatusFilter;
}

/** Sem `status` na URL a lista continua igual à de antes da Entrega 5 (sem campos novos nos próprios). */
registerMockHandler({ method: "get", path: "/student/" }, ({ params }) => {
  if (params.status === undefined) {
    return {
      status: 200,
      data: [...MOCK_STUDENTS, ...sharedWithMe()].filter(
        (student) => !isMockStudentArchived(student),
      ),
    };
  }
  return {
    status: 200,
    data: listMockStudents(parseStatusFilter(params.status)),
  };
});

/** Paciente (inclusive arquivado e compartilhado) que quem lê pode acessar. */
export function findMockAccessibleStudent(id: string): Student {
  if (id === MOCK_FOREIGN_STUDENT_ID) {
    throw new MockApiError(403, "UNAUTHORIZED");
  }
  const student = listMockStudents("ALL").find((item) => item.id === id);
  if (!student) {
    throw new MockApiError(404, "STUDENT_NOT_FOUND");
  }
  return student;
}

registerMockHandler({ method: "get", path: "/student/:id" }, ({ params }) => ({
  status: 200,
  data: findMockAccessibleStudent(params.id),
}));

export const studentMockHandlersRegistered = true;

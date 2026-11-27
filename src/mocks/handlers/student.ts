import type { Student, StudentStatusFilter } from "@/api/types";
import {
  MOCK_ARCHIVED_STUDENT,
  MOCK_SHARED_STUDENT,
  MOCK_STUDENT_SHARES,
} from "@/mocks/fixtures-e5";
import { MOCK_STUDENTS } from "@/mocks/fixtures";
import { getMockTeamScenario } from "@/mocks/mock-team-state";
import { MOCK_FOREIGN_STUDENT_ID } from "./plans";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

const STATUS_FILTERS: StudentStatusFilter[] = ["ACTIVE", "ARCHIVED", "ALL"];

/** Próprio e ativo, com os campos novos explícitos (EQ-13, PA-01). */
function decorate(student: Student): Student {
  return { access: "OWNER", status: "ACTIVE", ...student };
}

/**
 * Pacientes visíveis para o filtro, na ordem de `GET /student/` (compartilhado
 * depois dos próprios). O compartilhado só existe com o cenário de equipe ligado.
 */
export function listMockStudents(status: StudentStatusFilter): Student[] {
  const active: Student[] = [
    ...MOCK_STUDENTS.map(decorate),
    ...(getMockTeamScenario() === "none" ? [] : [MOCK_SHARED_STUDENT]),
  ];
  const archived = [MOCK_ARCHIVED_STUDENT];

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
      data:
        getMockTeamScenario() === "none"
          ? MOCK_STUDENTS
          : [...MOCK_STUDENTS, MOCK_SHARED_STUDENT],
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

registerMockHandler(
  { method: "get", path: "/student/:id/shares" },
  ({ params }) => {
    findMockAccessibleStudent(params.id);
    return {
      status: 200,
      data: structuredClone(MOCK_STUDENT_SHARES[params.id] ?? []),
    };
  },
);

export const studentMockHandlersRegistered = true;

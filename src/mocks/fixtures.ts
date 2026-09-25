// G-29: dados 100% fictícios usados pela camada de mocks (src/mocks/README.md).
import type {
  Appointment,
  Educator,
  EducatorLastSession,
  Student,
  TaskCategory,
  TaskNotebookWithGroups,
} from "@/api/types";
import { toBrasiliaISOString } from "@/utils/date";

export const MOCK_EDUCATOR: Educator = {
  id: "mock-educator-1",
  name: "Aline Ribeiro Souza",
  email: "educadora.mock@labirinto.test",
};

export const MOCK_TOKEN = "mock-token-aline";

export const MOCK_VALID_CREDENTIALS = {
  email: MOCK_EDUCATOR.email,
  password: "senha123",
};

/** Qualquer senha com este e-mail devolve 401 INVALID_CREDENTIALS. */
export const MOCK_INVALID_CREDENTIALS_EMAIL = "invalido.mock@labirinto.test";

/** Qualquer senha com este e-mail simula falha de rede (sem response). */
export const MOCK_NETWORK_ERROR_EMAIL = "semrede.mock@labirinto.test";

function todayAt(hour: number, minute = 0): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);

  return toBrasiliaISOString({
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour,
    minute,
  });
}

const mockStudentEntries: [
  string,
  string,
  number,
  Student["gender"],
  string | null,
][] = [
  ["student-1", "Lia Monteiro", 8, "female", null],
  ["student-2", "Caio Mendes", 9, "male", "https://example.test/caio.png"],
  ["student-3", "Nina Azevedo", 7, "female", null],
  ["student-4", "Theo Barros", 10, "male", "https://example.test/theo.png"],
  ["student-5", "Maya Freitas", 8, "female", null],
];

export const MOCK_STUDENTS: Student[] = mockStudentEntries.map(
  ([id, name, age, gender, photoUrl]) => ({
    id,
    name,
    age,
    gender: gender as Student["gender"],
    zipcode: "01000-000",
    road: "Rua Ficticia",
    housenumber: "123",
    phonenumber: "11999990000",
    learningTopics: ["leitura"],
    createdAt: "2026-01-01T12:00:00.000Z",
    educatorId: MOCK_EDUCATOR.id,
    photoUrl,
    documents: [],
    educators: [MOCK_EDUCATOR.id],
  }),
);

const mockAppointmentEntries: [
  string,
  string,
  number,
  Appointment["status"],
][] = [
  ["appointment-1", "student-1", 8, "PENDING"],
  ["appointment-2", "student-2", 10, "COMPLETED"],
  ["appointment-3", "student-3", 14, "PENDING"],
  ["appointment-4", "student-4", 16, "CANCELLED"],
];

export const MOCK_APPOINTMENTS: Appointment[] = mockAppointmentEntries.map(
  ([id, studentId, hour, status]) => ({
    id,
    educatorId: MOCK_EDUCATOR.id,
    studentId,
    scheduledAt: todayAt(hour),
    status,
    createdAt: "2026-01-01T12:00:00.000Z",
  }),
);

export const MOCK_LAST_SESSIONS: EducatorLastSession[] = [
  { studentName: "Lia Monteiro", sessionName: "Leitura inicial" },
  { studentName: "Caio Mendes", sessionName: "Palavras do cotidiano" },
];

/**
 * Espelha os ids/nomes/categorias de MOCK_TASK_GROUPS
 * (src/mocks/handlers/content.ts). Ids literais evitam import circular.
 */
const MOCK_TASK_GROUP_NAMES: Record<string, string> = {
  "group-1": "Alfabeto e sons",
  "group-2": "Vocabulário do dia a dia",
  "group-3": "Produção de texto guiada",
};

const MOCK_TASK_GROUP_TASK_IDS: Record<string, string[]> = {
  "group-1": ["task-1", "task-2"],
  "group-2": ["task-3"],
  "group-3": ["task-4", "task-5", "task-6"],
};

const MOCK_TASK_GROUP_CATEGORY: Record<string, TaskCategory> = {
  "group-1": "reading",
  "group-2": "vocabulary",
  "group-3": "writing",
};

/**
 * Vínculo caderno -> grupos, espelhando os ids fictícios de
 * MOCK_TASK_GROUPS/MOCK_TASKS (src/mocks/handlers/content.ts). Ids literais
 * evitam import circular fixtures.ts <-> handlers/content.ts.
 */
const mockNotebookGroupLinks: {
  description: string;
  groupIds: string[];
  taskIds: string[];
}[] = [
  {
    description: "Cores e formas",
    groupIds: ["group-1"],
    taskIds: ["task-1", "task-2"],
  },
  {
    description: "Palavras do dia",
    groupIds: ["group-2"],
    taskIds: ["task-3"],
  },
  {
    description: "Leitura guiada",
    groupIds: ["group-1", "group-2"],
    taskIds: ["task-1", "task-2", "task-3"],
  },
  {
    description: "Historias curtas",
    groupIds: ["group-3"],
    taskIds: ["task-4", "task-5", "task-6"],
  },
];

export const MOCK_TASK_NOTEBOOKS: TaskNotebookWithGroups[] =
  mockNotebookGroupLinks.map(({ description, groupIds, taskIds }, index) => ({
    notebook: {
      id: `notebook-${index + 1}`,
      educator: MOCK_EDUCATOR.id,
      tasks: taskIds,
      category: "reading",
      description,
      createdAt: "2026-01-01T12:00:00.000Z",
      taskGroupsIds: groupIds,
    },
    taskGroups: groupIds.map((groupId) => ({
      id: groupId,
      name: MOCK_TASK_GROUP_NAMES[groupId],
      tasksIds: MOCK_TASK_GROUP_TASK_IDS[groupId],
      educatorId: MOCK_EDUCATOR.id,
      category: MOCK_TASK_GROUP_CATEGORY[groupId],
    })),
  }));

export type MockHomeScenario = "default" | "no-sessions" | "no-appointments";

let mockHomeScenario: MockHomeScenario = "default";

export function setMockHomeScenario(scenario: MockHomeScenario): void {
  mockHomeScenario = scenario;
}

export function getMockHomeScenario(): MockHomeScenario {
  return mockHomeScenario;
}

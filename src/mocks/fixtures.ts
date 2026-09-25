// G-29: dados 100% fictícios usados pela camada de mocks (src/mocks/README.md).
import type {
  Appointment,
  Educator,
  EducatorLastSession,
  Student,
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

export const MOCK_TASK_NOTEBOOKS: TaskNotebookWithGroups[] = [
  "Cores e formas",
  "Palavras do dia",
  "Leitura guiada",
  "Historias curtas",
].map((description, index) => ({
  notebook: {
    id: `notebook-${index + 1}`,
    educator: MOCK_EDUCATOR.id,
    tasks: [],
    category: "reading",
    description,
    createdAt: "2026-01-01T12:00:00.000Z",
    taskGroupsIds: [],
  },
  taskGroups: [],
}));

export type MockHomeScenario = "default" | "no-sessions" | "no-appointments";

let mockHomeScenario: MockHomeScenario = "default";

export function setMockHomeScenario(scenario: MockHomeScenario): void {
  mockHomeScenario = scenario;
}

export function getMockHomeScenario(): MockHomeScenario {
  return mockHomeScenario;
}

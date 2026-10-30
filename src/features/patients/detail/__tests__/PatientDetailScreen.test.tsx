import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Appointment, Student, TaskNotebookSession } from "@/api/types";
import { fireEvent, render, screen } from "@/test-utils/render";

const routerPush = vi.fn();
const routerBack = vi.fn();
const openURL = vi.fn();

let studentsQuery: QueryState<Student[]>;
let appointmentsQuery: QueryState<Appointment[]>;
let analysisQuery: QueryState<unknown>;
let sessionsQuery: QueryState<TaskNotebookSession[]>;
let anamneseQuery: QueryState<{ id: string; answeredAt: string }[]>;

interface QueryState<T> {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
}

vi.mock("@/features/students/useStudents", () => ({
  useStudents: () => studentsQuery,
}));
vi.mock("@/features/appointments/useAppointments", () => ({
  useAppointments: () => appointmentsQuery,
}));
vi.mock("@/features/anamnese/responses/useAnamneseResponses", () => ({
  useAnamneseResponses: () => anamneseQuery,
}));
vi.mock("@/features/home/useHomeData", () => ({
  useHomeData: () => ({ educator: { name: "Aline Souza" } }),
}));
vi.mock("@/features/patients/detail/plans/usePatientPlans", () => ({
  usePatientPlans: () => ({ data: [], isError: false, refetch: vi.fn() }),
  useActivePdi: () => ({ data: [], isError: false, refetch: vi.fn() }),
}));
vi.mock("expo-router", () => ({
  useRouter: () => ({ push: routerPush, back: routerBack }),
}));
vi.mock("react-native", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-native")>()),
  Linking: { openURL },
}));

const { PatientDetailScreen, findNextAppointment } =
  await import("@/features/patients/detail/PatientDetailScreen");
const { useStudentAnalysis, useStudentSessions } =
  await import("@/features/patients/detail/usePatientDetailData");

vi.mock("@/features/patients/detail/usePatientDetailData", () => ({
  useStudentAnalysis: () => analysisQuery,
  useStudentSessions: () => sessionsQuery,
}));

const patient: Student = {
  id: "student-1",
  name: "Lia Monteiro",
  age: 8,
  gender: "female",
  zipcode: "01000-000",
  road: "Rua Fictícia",
  housenumber: "1",
  phonenumber: "(11) 99999-0000",
  learningTopics: ["Leitura", "Escrita"],
  createdAt: "2026-01-01T12:00:00.000Z",
  educatorId: "educator-1",
  photoUrl: null,
  documents: [],
};

const sessions: TaskNotebookSession[] = [
  {
    id: "session-1",
    studentId: patient.id,
    educatorId: "educator-1",
    name: "Leitura inicial",
    startedAt: "2026-10-01T10:00:00-03:00",
    finishedAt: "2026-10-01T10:30:00-03:00",
    answers: [
      {
        taskId: "task-1",
        selectedAlternativeId: "alternative-1",
        isCorrect: true,
        timeToAnswer: 10,
        answeredAt: "2026-10-01T10:01:00-03:00",
      },
      {
        taskId: "task-2",
        selectedAlternativeId: "alternative-2",
        isCorrect: false,
        timeToAnswer: 12,
        answeredAt: "2026-10-01T10:02:00-03:00",
      },
    ],
  },
];

function query<T>(data: T): QueryState<T> {
  return { data, isPending: false, isError: false, refetch: vi.fn() };
}

function setQueries(): void {
  studentsQuery = query([patient]);
  appointmentsQuery = query([]);
  analysisQuery = query({
    categories: {
      reading: { category: "reading", total: 2, correct: 1, accuracy: 0.5 },
    },
    total: { total: 2, correct: 1, accuracy: 0.5 },
    sessions,
  });
  sessionsQuery = query(sessions);
  anamneseQuery = query([]);
}

describe("PatientDetailScreen (PAC-03)", () => {
  beforeEach(() => {
    routerPush.mockClear();
    routerBack.mockClear();
    openURL.mockClear();
    openURL.mockResolvedValue(undefined);
    setQueries();
  });

  it("escolhe o próximo atendimento não cancelado a partir de agora", () => {
    expect(
      findNextAppointment(
        [
          {
            id: "cancelled",
            educatorId: "educator-1",
            studentId: patient.id,
            scheduledAt: "2026-10-10T10:00:00-03:00",
            status: "CANCELLED",
            durationMinutes: 50,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
          {
            id: "next",
            educatorId: "educator-1",
            studentId: patient.id,
            scheduledAt: "2026-10-08T11:00:00-03:00",
            status: "PENDING",
            durationMinutes: 50,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        patient.id,
        new Date("2026-10-07T12:00:00-03:00"),
      )?.id,
    ).toBe("next");
  });

  it("AGE-03.12: ignora atendimento já concluído ao escolher a próxima sessão", () => {
    const base = {
      educatorId: "educator-1",
      studentId: patient.id,
      durationMinutes: 50,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const now = new Date("2026-10-29T21:00:00-03:00");
    expect(
      findNextAppointment(
        [
          {
            ...base,
            id: "completed",
            scheduledAt: "2026-10-30T10:00:00-03:00",
            status: "COMPLETED",
          },
        ],
        patient.id,
        now,
      ),
    ).toBeUndefined();
    expect(
      findNextAppointment(
        [
          {
            ...base,
            id: "completed",
            scheduledAt: "2026-10-30T10:00:00-03:00",
            status: "COMPLETED",
          },
          {
            ...base,
            id: "pending",
            scheduledAt: "2026-10-31T09:00:00-03:00",
            status: "PENDING",
          },
        ],
        patient.id,
        now,
      )?.id,
    ).toBe("pending");
  });

  it("mostra resumo, dados da API, evolução e acessos da ficha", async () => {
    await render(<PatientDetailScreen patientId={patient.id} />);

    expect(screen.getAllByText("Lia Monteiro")).toHaveLength(2);
    expect(screen.getByText("8 anos · Ativo")).toBeTruthy();
    // dificuldade mapeada + rótulo traduzido da categoria "reading"
    expect(screen.getAllByText("Leitura")).toHaveLength(2);
    expect(screen.getByText("50% de acerto geral")).toBeTruthy();
    expect(screen.getByLabelText("Leitura: 50%")).toBeTruthy();
    expect(screen.getByText("Leitura inicial")).toBeTruthy();

    await fireEvent.press(
      screen.getByRole("button", { name: "Contatar responsável" }),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Editar" }));
    await fireEvent.press(screen.getByText("Leitura inicial"));
    await fireEvent.press(
      screen.getByRole("button", { name: "Iniciar sessão" }),
    );

    expect(openURL).toHaveBeenCalledWith(
      `https://wa.me/5511999990000?text=${encodeURIComponent("Olá! Tudo bem? Aqui é Aline Souza, do acompanhamento de Lia Monteiro.")}`,
    );
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/patients/[id]/edit",
      params: { id: patient.id },
    });
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/reports/session/[id]",
      params: { id: "session-1" },
    });
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/session/student",
      params: { studentId: expect.any(String) },
    });
  });

  it("alterna entre Visão geral e Planos preservando o conteúdo anterior (AC-PAC-04-04)", async () => {
    await render(<PatientDetailScreen patientId={patient.id} />);
    expect(screen.getByText("Próxima sessão")).toBeTruthy();
    expect(screen.getByText("PDI vigente")).toBeTruthy();
    await fireEvent.press(screen.getByRole("tab", { name: "Planos" }));
    expect(screen.getByText("Nenhum plano para este paciente")).toBeTruthy();
    expect(screen.queryByText("Próxima sessão")).toBeNull();
    await fireEvent.press(screen.getByRole("tab", { name: "Visão geral" }));
    expect(screen.getByText("Próxima sessão")).toBeTruthy();
  });

  it("mostra o responsável e usa seu telefone para contato", async () => {
    studentsQuery = query([
      {
        ...patient,
        guardianName: "Ana Monteiro",
        guardianRelationship: "Mãe",
        guardianPhone: "11977776666",
      },
    ]);
    await render(<PatientDetailScreen patientId={patient.id} />);
    expect(screen.getByText("Responsável: Ana Monteiro (Mãe)")).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Contatar responsável" }),
    );
    expect(openURL).toHaveBeenCalledWith(
      `https://wa.me/5511977776666?text=${encodeURIComponent("Olá, Ana Monteiro! Tudo bem? Aqui é Aline Souza, do acompanhamento de Lia Monteiro.")}`,
    );
  });

  it("mostra Nenhuma anamnese e abre a tela ao tocar", async () => {
    await render(<PatientDetailScreen patientId={patient.id} />);
    expect(screen.getByText("Nenhuma anamnese")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Anamnese" }));
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/patients/[id]/anamnese",
      params: { id: patient.id },
    });
  });

  it("mostra a data da última resposta", async () => {
    anamneseQuery = query([
      { id: "a", answeredAt: "2026-10-10T12:00:00.000Z" },
      { id: "b", answeredAt: "2026-10-20T12:00:00.000Z" },
    ]);
    await render(<PatientDetailScreen patientId={patient.id} />);
    expect(screen.getByText("Última em 20/10/2026")).toBeTruthy();
  });

  it("desabilita contato sem telefone e apresenta estados vazios próprios", async () => {
    studentsQuery = query([
      { ...patient, phonenumber: "", learningTopics: [] },
    ]);
    analysisQuery = query({
      categories: {},
      total: { total: 0, correct: 0, accuracy: 0 },
      sessions: [],
    });
    sessionsQuery = query([]);

    await render(<PatientDetailScreen patientId={patient.id} />);

    expect(
      screen.getByLabelText("Contatar responsável").props.accessibilityState
        .disabled,
    ).toBe(true);
    expect(screen.getByText("Paciente sem telefone cadastrado")).toBeTruthy();
    expect(screen.getByText("Nenhuma dificuldade mapeada")).toBeTruthy();
    expect(screen.getByText("Sem evolução registrada")).toBeTruthy();
    expect(screen.getByText("Nenhuma sessão registrada")).toBeTruthy();
    expect(screen.getByText("Nenhuma sessão agendada")).toBeTruthy();
  });

  it("mostra carregamento, erro recuperável e paciente não encontrado", async () => {
    studentsQuery = {
      ...query<Student[]>(undefined as never),
      isPending: true,
    };
    await render(<PatientDetailScreen patientId={patient.id} />);
    expect(screen.getByLabelText("Carregando paciente")).toBeTruthy();

    const refetch = vi.fn();
    studentsQuery = {
      data: undefined,
      isPending: false,
      isError: true,
      refetch,
    };
    const error = await render(<PatientDetailScreen patientId={patient.id} />);
    await fireEvent.press(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );
    expect(refetch).toHaveBeenCalledTimes(1);
    error.unmount();

    studentsQuery = query([]);
    await render(<PatientDetailScreen patientId="unknown" />);
    await fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
    expect(routerBack).toHaveBeenCalledTimes(1);
  });
});

describe("usePatientDetailData", () => {
  it("expõe consultas separadas para análise e lista de sessões", () => {
    expect(useStudentAnalysis).toBeTypeOf("function");
    expect(useStudentSessions).toBeTypeOf("function");
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react-native";

import type { Appointment, Student } from "@/api/types";
import { fireEvent, render, screen } from "@/test-utils/render";

const routerPush = vi.fn();
let studentsQuery: {
  data: Student[] | undefined;
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
};
let appointmentsQuery: {
  data: Appointment[] | undefined;
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
};

vi.mock("@/features/students/useStudents", () => ({
  useStudents: () => studentsQuery,
}));
vi.mock("@/features/appointments/useAppointments", () => ({
  useAppointments: () => appointmentsQuery,
}));
vi.mock("expo-router", () => ({ useRouter: () => ({ push: routerPush }) }));

const { PatientsListScreen } =
  await import("@/features/patients/list/PatientsListScreen");

function makeStudent(overrides: Partial<Student>): Student {
  return {
    id: "patient-1",
    name: "Nome",
    age: 8,
    gender: "female",
    zipcode: "01000-000",
    road: "Rua Fictícia",
    housenumber: "1",
    phonenumber: "11999990000",
    learningTopics: ["Leitura"],
    createdAt: "2026-01-01T12:00:00.000Z",
    educatorId: "educator-1",
    photoUrl: null,
    documents: [],
    educators: [],
    ...overrides,
  };
}

const patients = [
  makeStudent({ id: "1", name: "Zeca Alves", age: 9 }),
  makeStudent({
    id: "2",
    name: "Ágata Souza",
    learningTopics: ["Leitura", "Escrita", "Foco"],
  }),
];

function setQueries(): void {
  studentsQuery = {
    data: patients,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  };
  appointmentsQuery = {
    data: [],
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  };
}

describe("PatientsListScreen", () => {
  afterEach(cleanup);

  beforeEach(() => {
    routerPush.mockClear();
    setQueries();
  });

  it("exibe pacientes em ordem alfabética, dados disponíveis e pendências desabilitado", async () => {
    await render(<PatientsListScreen />);

    expect(screen.getByText("2 pacientes ativos")).toBeTruthy();
    expect(screen.getByText("Ágata Souza")).toBeTruthy();
    expect(screen.getByText("8 anos · Leitura, Escrita")).toBeTruthy();
    expect(
      screen.getByLabelText("Pendências · Em breve").props.accessibilityState
        .disabled,
    ).toBe(true);
  });

  it("busca e filtra pacientes com sessão hoje", async () => {
    appointmentsQuery = {
      ...appointmentsQuery,
      data: [
        {
          id: "today",
          educatorId: "educator-1",
          studentId: "1",
          scheduledAt: new Date().toISOString(),
          status: "PENDING",
          createdAt: "2026-01-01T12:00:00.000Z",
        },
      ],
    };
    await render(<PatientsListScreen />);

    await fireEvent.changeText(
      screen.getByPlaceholderText("Buscar paciente"),
      "agata",
    );
    expect(screen.getByText("Ágata Souza")).toBeTruthy();
    expect(screen.queryByText("Zeca Alves")).toBeNull();

    await fireEvent.changeText(
      screen.getByPlaceholderText("Buscar paciente"),
      "",
    );
    await fireEvent.press(screen.getByLabelText("Com sessão hoje"));
    expect(screen.getByText("Zeca Alves")).toBeTruthy();
    expect(screen.queryByText("Ágata Souza")).toBeNull();
  });

  it("navega para ficha e cadastro", async () => {
    await render(<PatientsListScreen />);

    await fireEvent.press(screen.getByLabelText("Abrir ficha de Ágata Souza"));
    await fireEvent.press(screen.getByLabelText("Cadastrar paciente"));

    expect(routerPush).toHaveBeenCalledWith("/students/2");
    expect(routerPush).toHaveBeenCalledWith("/students/new");
  });

  it("mostra carregamento e erro recuperável", async () => {
    studentsQuery = { ...studentsQuery, data: undefined, isPending: true };
    const loading = await render(<PatientsListScreen />);
    expect(screen.getByLabelText("Carregando pacientes")).toBeTruthy();
    loading.unmount();

    const refetch = vi.fn();
    studentsQuery = {
      data: undefined,
      isPending: false,
      isError: true,
      refetch,
    };
    const error = await render(<PatientsListScreen />);
    await fireEvent.press(screen.getByLabelText("Tentar novamente"));
    expect(refetch).toHaveBeenCalledTimes(1);
    error.unmount();
  });

  it("mostra vazio sem pacientes", async () => {
    studentsQuery = {
      data: [],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    };
    appointmentsQuery = {
      data: [],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    };
    await render(<PatientsListScreen />);
    expect(await screen.findByText("Nenhum paciente encontrado")).toBeTruthy();
  });
});

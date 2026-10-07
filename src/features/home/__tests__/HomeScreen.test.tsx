import { beforeEach, describe, expect, it, vi } from "vitest";

import type { HomeData, HomeQueryResult } from "@/features/home/useHomeData";
import { fireEvent, render, screen } from "@/test-utils/render";

const routerPush = vi.fn();
let homeQuery: HomeQueryResult;
const onlineState = vi.hoisted(() => ({ value: true }));

vi.mock("@/features/home/useHomeData", () => ({
  useHomeQuery: () => homeQuery,
}));
vi.mock("@/hooks/useOnline", () => ({ useOnline: () => onlineState.value }));
vi.mock("expo-router", () => ({ useRouter: () => ({ push: routerPush }) }));

const homeData: HomeData = {
  educator: {
    id: "educator-1",
    name: "Aline Souza",
    email: "aline@example.test",
  },
  todayAppointments: [
    {
      appointment: {
        id: "appointment-done",
        educatorId: "educator-1",
        studentId: "student-2",
        scheduledAt: "2026-04-02T11:00:00.000Z",
        status: "COMPLETED",
        createdAt: "2026-04-01T12:00:00.000Z",
      },
      student: {
        id: "student-2",
        name: "Davi",
        age: 8,
        gender: "male",
        zipcode: "01000-000",
        road: "Rua Fictícia",
        housenumber: "1",
        phonenumber: "11999990000",
        learningTopics: [],
        createdAt: "2026-01-01T12:00:00.000Z",
        educatorId: "educator-1",
        photoUrl: null,
        documents: [],
        educators: ["educator-1"],
      },
    },
    {
      appointment: {
        id: "appointment-next",
        educatorId: "educator-1",
        studentId: "student-1",
        scheduledAt: "2026-04-02T14:00:00.000Z",
        status: "PENDING",
        createdAt: "2026-04-01T12:00:00.000Z",
      },
      student: {
        id: "student-1",
        name: "Lia",
        age: 8,
        gender: "female",
        zipcode: "01000-000",
        road: "Rua Fictícia",
        housenumber: "1",
        phonenumber: "11999990000",
        learningTopics: [],
        createdAt: "2026-01-01T12:00:00.000Z",
        educatorId: "educator-1",
        photoUrl: null,
        documents: [],
        educators: ["educator-1"],
      },
    },
    {
      appointment: {
        id: "appointment-cancelled",
        educatorId: "educator-1",
        studentId: "student-3",
        scheduledAt: "2026-04-02T15:00:00.000Z",
        status: "CANCELLED",
        createdAt: "2026-04-01T12:00:00.000Z",
      },
      student: {
        id: "student-3",
        name: "Bia",
        age: 8,
        gender: "female",
        zipcode: "01000-000",
        road: "Rua Fictícia",
        housenumber: "1",
        phonenumber: "11999990000",
        learningTopics: [],
        createdAt: "2026-01-01T12:00:00.000Z",
        educatorId: "educator-1",
        photoUrl: null,
        documents: [],
        educators: ["educator-1"],
      },
    },
  ],
};

const { HomeScreen } = await import("@/features/home/HomeScreen");

function setHomeQuery(overrides: Partial<HomeQueryResult> = {}): void {
  homeQuery = {
    data: homeData,
    isPending: false,
    isError: false,
    refetch: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe("HomeScreen (AC-HOME-01-01..04)", () => {
  beforeEach(() => {
    onlineState.value = true;
    routerPush.mockClear();
  });

  it("mostra o próximo atendimento, agenda ordenada e os atalhos", async () => {
    setHomeQuery();
    await render(<HomeScreen />);

    expect(screen.getByText("Olá, Aline")).toBeTruthy();
    expect(screen.getAllByText("Próximo atendimento")).toHaveLength(2);
    expect(screen.getAllByText("Lia")).toHaveLength(2);
    expect(screen.getByText("Concluído")).toBeTruthy();
    expect(screen.getByText("Cancelado")).toBeTruthy();
    expect(screen.getByText("Novo paciente")).toBeTruthy();
    expect(screen.getByText("Criar plano")).toBeTruthy();
    expect(screen.getByText("Aplicar escala")).toBeTruthy();
    expect(screen.getByText("Atividades")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Ver ficha" }));
    await fireEvent.press(
      screen.getByRole("button", { name: "Iniciar sessão" }),
    );
    await fireEvent.press(screen.getByText("Novo paciente"));
    await fireEvent.press(screen.getByText("Criar plano"));
    await fireEvent.press(screen.getByText("Aplicar escala"));
    await fireEvent.press(screen.getByText("Atividades"));
    await fireEvent.press(
      screen.getAllByRole("button", { name: "Ver agenda" })[0]!,
    );

    expect(routerPush).toHaveBeenCalledWith("/students/student-1");
    expect(routerPush).toHaveBeenCalledWith("/session/student");
    expect(routerPush).toHaveBeenCalledWith("/students/new");
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/shell/coming-soon",
      params: { title: "Criar plano" },
    });
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/shell/coming-soon",
      params: { title: "Aplicar escala" },
    });
    expect(routerPush).toHaveBeenCalledWith("/activities");
    expect(routerPush).toHaveBeenCalledWith("/(tabs)/agenda");
  });

  it("mostra o estado vazio do hero quando não há atendimento pendente", async () => {
    setHomeQuery({
      data: {
        ...homeData,
        todayAppointments: homeData.todayAppointments.filter(
          ({ appointment }) => appointment.status !== "PENDING",
        ),
      },
    });
    await render(<HomeScreen />);

    expect(screen.getByText("Sem atendimentos hoje")).toBeTruthy();
    await fireEvent.press(
      screen.getAllByRole("button", { name: "Ver agenda" })[0]!,
    );
    expect(routerPush).toHaveBeenCalledWith("/(tabs)/agenda");
  });

  it("mostra carregamento", async () => {
    setHomeQuery({ data: undefined, isPending: true });
    await render(<HomeScreen />);
    expect(screen.getByText("Carregando início...")).toBeTruthy();
  });

  it("mostra erro recuperável", async () => {
    const refetch = vi.fn().mockResolvedValue([]);
    setHomeQuery({ data: undefined, isError: true, refetch });
    await render(<HomeScreen />);
    await fireEvent.press(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("mantém o aviso de dados em cache offline", async () => {
    onlineState.value = false;
    setHomeQuery();
    await render(<HomeScreen />);
    expect(
      screen.getByText("Sem conexão - mostrando dados salvos"),
    ).toBeTruthy();
  });
});

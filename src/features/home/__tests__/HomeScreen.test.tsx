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
  educator: { id: "educator-1", name: "Aline", email: "aline@example.test" },
  todayAppointments: [
    {
      appointment: {
        id: "appointment-1",
        educatorId: "educator-1",
        studentId: "student-1",
        scheduledAt: "2026-04-02T11:00:00.000Z",
        status: "PENDING",
        createdAt: "2026-04-01T12:00:00.000Z",
      },
      student: {
        id: "student-1",
        name: "Lia",
        age: 8,
        gender: "female",
        zipcode: "01000-000",
        road: "Rua Ficticia",
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
  scheduledAppointmentsCount: 1,
  lastSessions: [{ studentName: "Lia", sessionName: "Leitura guiada" }],
  recentNotebooks: [
    {
      notebook: {
        id: "notebook-1",
        educator: "educator-1",
        tasks: ["task-1"],
        category: "reading",
        description: "Cores e formas",
        createdAt: "2026-01-01T12:00:00.000Z",
        taskGroupsIds: [],
      },
      taskGroups: [],
    },
    {
      notebook: {
        id: "notebook-2",
        educator: "educator-1",
        tasks: [],
        category: "writing",
        description: "Palavras do dia",
        createdAt: "2026-01-01T12:00:00.000Z",
        taskGroupsIds: [],
      },
      taskGroups: [],
    },
    {
      notebook: {
        id: "notebook-3",
        educator: "educator-1",
        tasks: [],
        category: "vocabulary",
        description: "Leitura guiada",
        createdAt: "2026-01-01T12:00:00.000Z",
        taskGroupsIds: [],
      },
      taskGroups: [],
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

describe("HomeScreen (AC-603-01..04)", () => {
  beforeEach(() => {
    onlineState.value = true;
    routerPush.mockClear();
  });

  it("mostra o estado 02 e navega para sessao, agenda e destinos Em breve", async () => {
    setHomeQuery();
    await render(<HomeScreen />);

    await screen.findByText("Sessões de hoje");
    expect(screen.queryByText("Atividades Recentes")).toBeNull();
    await fireEvent.press(
      screen.getByRole("button", { name: "Iniciar Sessão" }),
    );
    await fireEvent.press(screen.getAllByText("Lia")[0]);
    await fireEvent.press(screen.getByText("Ver todas →"));
    await fireEvent.press(screen.getByText("Leitura guiada"));

    expect(routerPush).toHaveBeenCalledWith("/session/student");
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/appointments",
      params: { date: "2026-04-02" },
    });
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/shell/coming-soon",
      params: { title: "Relatórios" },
    });
  });

  it("mostra o estado 03 e as tres atividades recentes navegaveis", async () => {
    setHomeQuery({
      data: {
        ...homeData,
        todayAppointments: [],
        scheduledAppointmentsCount: 0,
      },
    });
    await render(<HomeScreen />);

    await screen.findByText("Boas-vindas!");
    expect(screen.queryByText("Sessões de hoje")).toBeNull();
    expect(screen.getByText("Atividades Recentes")).toBeTruthy();
    await fireEvent.press(screen.getByText("Cores e formas"));
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/shell/coming-soon",
      params: { title: "Atividades" },
    });
  });

  it("mostra carregamento", async () => {
    setHomeQuery({ data: undefined, isPending: true });
    await render(<HomeScreen />);
    expect(screen.getByLabelText("Carregando Home")).toBeTruthy();
  });

  it("mostra erro recuperavel", async () => {
    const refetch = vi.fn().mockResolvedValue([]);
    setHomeQuery({ data: undefined, isError: true, refetch });
    await render(<HomeScreen />);
    await screen.findByRole("alert");
    await fireEvent.press(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("mantem os dados em cache quando offline", async () => {
    onlineState.value = false;
    setHomeQuery();
    await render(<HomeScreen />);
    expect(
      screen.getByLabelText("Sem conexão - mostrando dados salvos"),
    ).toBeTruthy();
    expect(screen.getByText("Sessões de hoje")).toBeTruthy();
  });
});

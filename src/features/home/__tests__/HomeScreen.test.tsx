import { beforeEach, describe, expect, it, vi } from "vitest";

import type { HomeData, HomeQueryResult } from "@/features/home/useHomeData";
import { fireEvent, render, screen } from "@/test-utils/render";

const routerPush = vi.fn();
const openURL = vi.fn();
vi.mock("react-native", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-native")>()),
  Linking: { openURL },
}));
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
        durationMinutes: 50,
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
      },
    },
    {
      appointment: {
        id: "appointment-next",
        educatorId: "educator-1",
        studentId: "student-1",
        scheduledAt: "2026-04-02T14:00:00.000Z",
        status: "PENDING",
        durationMinutes: 50,
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
      },
    },
    {
      appointment: {
        id: "appointment-cancelled",
        educatorId: "educator-1",
        studentId: "student-3",
        scheduledAt: "2026-04-02T15:00:00.000Z",
        status: "CANCELLED",
        durationMinutes: 50,
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
    openURL.mockReset().mockResolvedValue(undefined);
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

    expect(routerPush).toHaveBeenCalledWith("/patients/student-1");
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/session/student",
      params: { studentId: "student-1", appointmentId: expect.any(String) },
    });
    expect(routerPush).toHaveBeenCalledWith("/patients/new");
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/shell/coming-soon",
      params: { title: "Novo plano" },
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

  it("AC-AGE-02-03 mostra Lembrete só em item pendente com telefone", async () => {
    setHomeQuery();
    await render(<HomeScreen />);
    expect(screen.getAllByRole("button", { name: "Lembrete" })).toHaveLength(1);
    await fireEvent.press(screen.getByRole("button", { name: "Lembrete" }));
    expect(openURL).toHaveBeenCalledWith(
      `https://wa.me/5511999990000?text=${encodeURIComponent("Olá! Passando para lembrar do atendimento de Lia na quinta-feira, 02/04, às 11:00. Qualquer imprevisto, é só avisar por aqui.")}`,
    );
  });

  it("AC-AGE-02-04 omite a ação de lembrete sem telefone", async () => {
    setHomeQuery({
      data: {
        ...homeData,
        todayAppointments: homeData.todayAppointments.map((item) =>
          item.appointment.status === "PENDING"
            ? { ...item, student: { ...item.student!, phonenumber: "" } }
            : item,
        ),
      },
    });
    await render(<HomeScreen />);
    expect(screen.queryByRole("button", { name: "Lembrete" })).toBeNull();
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

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
const suggestionsState = vi.hoisted(() => ({ count: 0 }));
vi.mock("@/features/plans/suggestions/usePlanSuggestions", () => ({
  usePendingSuggestions: () => ({
    data: Array.from({ length: suggestionsState.count }, (_, index) => ({
      id: `s-${index}`,
    })),
  }),
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
    // D14: o "próximo" depende da hora atual; fixa 09:00 em São Paulo.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-04-02T12:00:00.000Z"));
    onlineState.value = true;
    suggestionsState.count = 0;
    routerPush.mockClear();
    openURL.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
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
    expect(routerPush).toHaveBeenCalledWith("/plans/new");
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

    expect(screen.getByText("Sem mais atendimentos hoje")).toBeTruthy();
    await fireEvent.press(
      screen.getAllByRole("button", { name: "Ver agenda" })[0]!,
    );
    expect(routerPush).toHaveBeenCalledWith("/(tabs)/agenda");
  });

  it("E-06 mantém 'Sem atendimentos hoje' quando o dia não tem atendimentos", async () => {
    setHomeQuery({ data: { ...homeData, todayAppointments: [] } });
    await render(<HomeScreen />);

    expect(screen.getByText("Sem atendimentos hoje")).toBeTruthy();
    expect(screen.queryByText("Sem mais atendimentos hoje")).toBeNull();
  });

  it("E-05 rotula os pendentes: próximo, agendado e pendente já encerrado", async () => {
    const [done, next] = homeData.todayAppointments as [
      HomeData["todayAppointments"][number],
      HomeData["todayAppointments"][number],
    ];
    const withAppointment = (
      id: string,
      scheduledAt: string,
    ): HomeData["todayAppointments"][number] => ({
      ...next,
      appointment: { ...next.appointment, id, scheduledAt },
    });
    setHomeQuery({
      data: {
        ...homeData,
        todayAppointments: [
          done,
          withAppointment("ended", "2026-04-02T10:00:00.000Z"),
          withAppointment("upcoming", "2026-04-02T14:00:00.000Z"),
          withAppointment("later", "2026-04-02T16:00:00.000Z"),
        ],
      },
    });
    await render(<HomeScreen />);

    // hero (overline) + 1 item da agenda
    expect(screen.getAllByText("Próximo atendimento")).toHaveLength(2);
    expect(screen.getAllByText("Pendente")).toHaveLength(1);
    expect(screen.getAllByText("Agendado")).toHaveLength(1);
    expect(screen.getAllByText("Concluído")).toHaveLength(1);
  });

  it("AC-AGE-02-03 mostra Lembrete só em item pendente com telefone", async () => {
    setHomeQuery();
    await render(<HomeScreen />);
    // QA-03: o rótulo acessível diz o que a ação faz e para quem.
    const reminder = "Enviar lembrete pelo WhatsApp para Lia";
    expect(screen.getAllByRole("button", { name: reminder })).toHaveLength(1);
    expect(screen.getByText("Lembrete")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: reminder }));
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
    expect(
      screen.queryByRole("button", { name: /Enviar lembrete pelo WhatsApp/ }),
    ).toBeNull();
    expect(screen.queryByText("Lembrete")).toBeNull();
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

  it("AC-PLN-05-04 mostra o cartão com a contagem de pendentes e abre as sugestões", async () => {
    suggestionsState.count = 3;
    setHomeQuery();
    await render(<HomeScreen />);
    await fireEvent.press(screen.getByText("3 sugestões da IA para revisar"));
    expect(routerPush).toHaveBeenCalledWith("/plans/suggestions");
  });

  it("AC-PLN-05-04 esconde o cartão quando não há pendentes", async () => {
    setHomeQuery();
    await render(<HomeScreen />);
    expect(screen.queryByText(/sugestões? da IA para revisar/)).toBeNull();
  });
});

import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { ApiError } from "@/api/errors";
import type { RecommendedTask, TaskSummary } from "@/api/types";
import type { UseActivitiesQueryResult } from "@/features/activities/useActivitiesData";
import type { ActivityListItem } from "@/features/activities/types";
import { fireEvent, render, screen, waitFor } from "@/test-utils/render";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const routerPush = vi.fn();
const routerSetParams = vi.fn();
let activitiesQuery: UseActivitiesQueryResult;

vi.mock("@/features/activities/useActivitiesData", () => ({
  useActivitiesQuery: () => activitiesQuery,
}));
vi.mock("@/features/students/useStudents", () => ({
  useStudents: () => ({
    data: [{ id: "student-a", name: "Paciente Teste A" }],
  }),
}));
vi.mock("@/features/appointments/useAppointments", () => ({
  useAppointments: () => ({ data: [] }),
}));
vi.mock("expo-router", () => ({
  useRouter: () => ({
    push: routerPush,
    back: vi.fn(),
    setParams: routerSetParams,
  }),
}));

function summary(
  id: string,
  title: string,
  overrides: Partial<TaskSummary> = {},
): TaskSummary {
  return {
    id,
    type: "wordBuilder",
    format: "INTERACTIVE",
    source: "LIBRARY",
    category: "writing",
    title,
    skills: [{ code: "VOCABULARY", label: "Vocabulário" }],
    tone: "mint",
    ...overrides,
  };
}

const LIBRARY = [
  summary("lib-1", "BOLA"),
  summary("lib-2", "Folha de sílabas", {
    type: "printable",
    format: "PRINTABLE",
  }),
];
const MINE = [summary("mine-1", "Minha atividade", { source: "EDUCATOR" })];
const RECOMMENDED: RecommendedTask[] = [
  {
    ...summary("rec-1", "Forme a palavra"),
    reason: "Consciência fonológica · dificuldade mapeada",
  },
  { ...summary("rec-2", "Memória visual"), reason: "x" },
];

let catalogCalls: string[];
let catalogOverride: ((url: string) => unknown) | undefined;

function fakeGet(url: string) {
  if (url.startsWith("/task/catalog")) {
    catalogCalls.push(url);
    if (catalogOverride) return Promise.resolve({ data: catalogOverride(url) });
    const query = new URLSearchParams(url.split("?")[1] ?? "");
    const base = query.get("source") === "LIBRARY" ? LIBRARY : MINE;
    const format = query.get("format");
    return Promise.resolve({
      data: {
        items: base.filter((item) => !format || item.format === format),
      },
    });
  }
  if (url === "/task/skills") {
    return Promise.resolve({
      data: [{ code: "VOCABULARY", label: "Vocabulário", learningTopics: [] }],
    });
  }
  if (url.startsWith("/task/recommended")) {
    if (url.includes("student-x")) {
      return Promise.reject(
        Object.assign(new ApiError({ message: "x", status: 404 }), {}),
      );
    }
    return Promise.resolve({ data: RECOMMENDED });
  }
  return Promise.reject(new Error(`rota inesperada ${url}`));
}

const { ActivitiesScreen } =
  await import("@/features/activities/ActivitiesScreen");

const legacyItems: ActivityListItem[] = [
  {
    id: "notebook-1",
    kind: "notebook",
    title: "Sons e Letras",
    secondary: "2 tarefas",
    category: "reading",
  },
  {
    id: "group-1",
    kind: "group",
    title: "Alfabeto e sons",
    secondary: "3 atividades",
    category: "reading",
  },
];

function noRetryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

async function renderScreen(studentId?: string) {
  await render(<ActivitiesScreen studentId={studentId} />, {
    queryClient: noRetryClient(),
  });
}

describe("ActivitiesScreen (ATV-09)", () => {
  beforeEach(() => {
    routerPush.mockClear();
    routerSetParams.mockClear();
    catalogCalls = [];
    catalogOverride = undefined;
    activitiesQuery = {
      items: legacyItems,
      isPending: false,
      isError: false,
      refetch: vi.fn().mockResolvedValue([]),
    };
    vi.spyOn(apiClient, "get").mockImplementation(((url: string) =>
      fakeGet(url)) as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mostra as seções Atividades prontas e Minhas atividades", async () => {
    await renderScreen();

    expect(screen.getByRole("header", { name: "Atividades" })).toBeTruthy();
    expect(await screen.findByText("BOLA")).toBeTruthy();
    expect(await screen.findByText("Minha atividade")).toBeTruthy();
    expect(screen.getByText("Atividades prontas")).toBeTruthy();
    expect(screen.getByText("Minhas atividades")).toBeTruthy();
    expect(screen.getAllByText("Vocabulário · Interativa").length).toBe(2);
  });

  it("AC-ATV-09-01: formato vai como query para o catálogo", async () => {
    await renderScreen();
    await screen.findByText("BOLA");

    await fireEvent.press(screen.getByText("Imprimíveis"));

    expect(await screen.findByText("Folha de sílabas")).toBeTruthy();
    expect(screen.queryByText("BOLA")).toBeNull();
    expect(
      catalogCalls.some(
        (url) =>
          url.includes("format=PRINTABLE") && url.includes("source=LIBRARY"),
      ),
    ).toBe(true);
  });

  it("AC-ATV-09-01: busca só vai com 2 ou mais letras, depois de 300 ms", async () => {
    await renderScreen();
    await screen.findByText("BOLA");
    const input = screen.getByPlaceholderText("Buscar por habilidade ou tema");

    await fireEvent.changeText(input, "s");
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(catalogCalls.some((url) => url.includes("search="))).toBe(false);

    await fireEvent.changeText(input, "sil");
    await waitFor(() =>
      expect(catalogCalls.some((url) => url.includes("search=sil"))).toBe(true),
    );
  });

  it("AC-ATV-09-01: habilidade vai como skill", async () => {
    await renderScreen();
    await screen.findByText("BOLA");

    await fireEvent.press(screen.getByLabelText("Habilidade"));
    await fireEvent.press(await screen.findByText("Vocabulário"));

    await waitFor(() =>
      expect(catalogCalls.some((url) => url.includes("skill=VOCABULARY"))).toBe(
        true,
      ),
    );
  });

  it("AC-ATV-09-02: sem paciente de contexto não há recomendação", async () => {
    await renderScreen();
    await screen.findByText("BOLA");

    expect(screen.queryByText(/Recomendado para/)).toBeNull();
    expect(screen.queryByText(/Para: /)).toBeNull();
  });

  it("AC-ATV-09-02: com paciente mostra o motivo do servidor e o chip limpa o contexto", async () => {
    await renderScreen("student-a");

    expect(await screen.findByText("Recomendado para Paciente")).toBeTruthy();
    expect(
      screen.getByText("Consciência fonológica · dificuldade mapeada"),
    ).toBeTruthy();
    expect(screen.getByText("Outras para Paciente")).toBeTruthy();

    await fireEvent.press(screen.getByText("Iniciar atividade"));
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/activities/[id]",
      params: { id: "rec-1" },
    });

    await fireEvent.press(screen.getByText("Para: Paciente ✕"));
    expect(routerSetParams).toHaveBeenCalledWith({ studentId: undefined });
    expect(screen.queryByText(/Recomendado para/)).toBeNull();
  });

  it("paciente inexistente (404) esconde o contexto", async () => {
    await renderScreen("student-x");
    await screen.findByText("BOLA");

    await waitFor(() => expect(screen.queryByText(/Para: /)).toBeNull());
  });

  it("toca num cartão do catálogo e abre o detalhe", async () => {
    await renderScreen();

    await fireEvent.press(await screen.findByLabelText("BOLA"));

    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/content/task/[id]",
      params: { id: "lib-1" },
    });
  });

  it("Ver todas abre o catálogo da biblioteca com os filtros", async () => {
    await renderScreen();
    await screen.findByText("BOLA");
    await fireEvent.press(screen.getByText("Interativas"));

    await fireEvent.press(await screen.findByText("Ver todas"));

    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/activities/catalog",
      params: { source: "LIBRARY", format: "INTERACTIVE" },
    });
  });

  it("vazio sem filtro em Minhas atividades orienta a criar", async () => {
    catalogOverride = (url) =>
      url.includes("source=EDUCATOR") ? { items: [] } : { items: LIBRARY };
    await renderScreen();

    expect(
      await screen.findByText("Você ainda não criou atividades."),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Toque em + para criar ou duplique uma atividade pronta.",
      ),
    ).toBeTruthy();
  });

  it("erro do catálogo mostra tentar novamente na seção", async () => {
    catalogOverride = () => {
      throw new Error("falha");
    };
    await renderScreen();

    expect(
      (await screen.findAllByText("Não foi possível carregar as atividades."))
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: "Tentar novamente" }).length,
    ).toBeGreaterThan(0);
  });

  it("AC-ATV-09-05: Cadernos e Grupos continuam navegáveis pelos chips", async () => {
    await renderScreen();

    await fireEvent.press(screen.getByText("Cadernos"));
    expect(screen.getByText("Sons e Letras")).toBeTruthy();
    expect(screen.queryByText("Alfabeto e sons")).toBeNull();
    expect(screen.queryByText("Minhas atividades")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Sons e Letras"));
    expect(routerPush).toHaveBeenCalledWith("/content/notebook/notebook-1");

    await fireEvent.press(screen.getByText("Grupos"));
    expect(screen.getByText("Alfabeto e sons")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Alfabeto e sons"));
    expect(routerPush).toHaveBeenCalledWith("/content/group/group-1");
  });

  it("abre as opções de criação", async () => {
    await renderScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Criar" }));
    await fireEvent.press(
      screen.getByRole("button", { name: "Atividade com IA" }),
    );

    expect(routerPush).toHaveBeenCalledWith("/content/new-task-ai");
  });
});

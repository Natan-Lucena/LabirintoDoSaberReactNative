import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UseActivitiesQueryResult } from "@/features/activities/useActivitiesData";
import type { ActivityListItem } from "@/features/activities/types";
import { fireEvent, render, screen } from "@/test-utils/render";

const routerPush = vi.fn();
let activitiesQuery: UseActivitiesQueryResult;

vi.mock("@/features/activities/useActivitiesData", () => ({
  useActivitiesQuery: () => activitiesQuery,
}));
vi.mock("expo-router", () => ({ useRouter: () => ({ push: routerPush }) }));

const items: ActivityListItem[] = [
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
  {
    id: "task-1",
    kind: "task",
    title: "O que significa 'veloz'?",
    secondary: "2 alternativas",
    category: "vocabulary",
  },
];

const { ActivitiesScreen } =
  await import("@/features/activities/ActivitiesScreen");

function setActivitiesQuery(
  overrides: Partial<UseActivitiesQueryResult> = {},
): void {
  activitiesQuery = {
    items,
    isPending: false,
    isError: false,
    refetch: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe("ActivitiesScreen (ATV-01)", () => {
  beforeEach(() => {
    routerPush.mockClear();
    setActivitiesQuery();
  });

  it("mostra o banco pedagógico em grade com metadados dos dados", async () => {
    await render(<ActivitiesScreen />);

    expect(screen.getByRole("header", { name: "Atividades" })).toBeTruthy();
    expect(screen.getByText("Banco pedagógico")).toBeTruthy();
    expect(
      screen.getByPlaceholderText("Buscar por habilidade ou tema"),
    ).toBeTruthy();
    expect(screen.getByText("Atividades prontas")).toBeTruthy();
    expect(screen.getByText("Sons e Letras")).toBeTruthy();
    expect(screen.getByText("Alfabeto e sons")).toBeTruthy();
    expect(screen.getByText("O que significa 'veloz'?")).toBeTruthy();
  });

  it("filtra por tipo ao selecionar um chip", async () => {
    await render(<ActivitiesScreen />);

    await fireEvent.press(screen.getByText("Cadernos"));

    expect(screen.getByText("Sons e Letras")).toBeTruthy();
    expect(screen.queryByText("Alfabeto e sons")).toBeNull();
  });

  it("busca sem resultado mostra estado vazio", async () => {
    await render(<ActivitiesScreen />);

    await fireEvent.changeText(
      screen.getByPlaceholderText("Buscar por habilidade ou tema"),
      "não existe",
    );

    expect(screen.getByText("Nenhum conteúdo encontrado")).toBeTruthy();
  });

  it("toca num caderno e navega para o detalhe do caderno (D-07)", async () => {
    await render(<ActivitiesScreen />);

    await fireEvent.press(screen.getByLabelText("Sons e Letras"));

    expect(routerPush).toHaveBeenCalledWith("/content/notebook/notebook-1");
  });

  it("toca num grupo e navega para o detalhe do grupo (D-07)", async () => {
    await render(<ActivitiesScreen />);

    await fireEvent.press(screen.getByLabelText("Alfabeto e sons"));

    expect(routerPush).toHaveBeenCalledWith("/content/group/group-1");
  });

  it("toca numa atividade e navega para o detalhe da atividade (D-07)", async () => {
    await render(<ActivitiesScreen />);

    await fireEvent.press(screen.getByLabelText("O que significa 'veloz'?"));

    expect(routerPush).toHaveBeenCalledWith("/content/task/task-1");
  });

  it("mostra carregando enquanto os dados chegam", async () => {
    setActivitiesQuery({ items: undefined, isPending: true });
    await render(<ActivitiesScreen />);

    expect(screen.getByText("Carregando Atividades")).toBeTruthy();
  });

  it("mostra erro com nova tentativa (AC-X-01)", async () => {
    setActivitiesQuery({ items: undefined, isError: true });
    await render(<ActivitiesScreen />);

    expect(
      screen.getByText("Não foi possível carregar as atividades."),
    ).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );
    expect(activitiesQuery.refetch).toHaveBeenCalledOnce();
  });

  it("filtra por categoria", async () => {
    await render(<ActivitiesScreen />);

    await fireEvent.press(screen.getByText("Vocabulário"));

    expect(screen.queryByText("Sons e Letras")).toBeNull();
  });

  it("abre as quatro opções de criação", async () => {
    await render(<ActivitiesScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Criar" }));

    expect(screen.getByRole("button", { name: "Atividade" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Atividade com IA" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Caderno" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Grupo" })).toBeTruthy();
  });
});

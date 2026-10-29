import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlanSummary } from "@/api/types";
import { fireEvent, render, screen } from "@/test-utils/render";

const push = vi.fn();
const back = vi.fn();
const refetch = vi.fn();
const online = vi.hoisted(() => ({ value: true }));
let plans: PlanSummary[] | undefined;
let pending = false;
let failed = false;

vi.mock("expo-router", () => ({ useRouter: () => ({ push, back }) }));
vi.mock("@/hooks/useOnline", () => ({ useOnline: () => online.value }));
vi.mock("@/features/plans/hub/usePlans", () => ({
  usePlans: () => ({
    data: plans,
    isPending: pending,
    isError: failed,
    refetch,
  }),
}));

const { PlansHubScreen } = await import("@/features/plans/hub/PlansHubScreen");
const { NEW_PLAN_ROUTE, planDetailRoute } =
  await import("@/features/plans/routes");

function plan(overrides: Partial<PlanSummary> & { id: string }): PlanSummary {
  return {
    educatorId: "educator-1",
    studentId: "student-1",
    studentName: "Lia Monteiro",
    type: "PDI",
    status: "ACTIVE",
    source: "AI",
    title: "Plano de leitura",
    generalObjective: "Ler com autonomia",
    consideredDifficulties: [],
    startDate: "2026-10-01",
    endDate: "2027-01-01",
    progress: {
      totalGoals: 4,
      achievedGoals: 1,
      inProgressGoals: 1,
      percent: 25,
    },
    createdAt: "2026-10-01T12:00:00.000Z",
    updatedAt: "2026-10-20T12:00:00.000Z",
    ...overrides,
  };
}

describe("PlansHubScreen (PLN-01)", () => {
  beforeEach(() => {
    push.mockClear();
    back.mockClear();
    refetch.mockClear();
    online.value = true;
    pending = false;
    failed = false;
    plans = [
      plan({ id: "p1", nextReviewDate: "2026-11-05" }),
      plan({
        id: "p2",
        type: "PE",
        studentName: "Caio Mendes",
        title: "Sessão de escrita",
        progress: {
          totalGoals: 2,
          achievedGoals: 0,
          inProgressGoals: 0,
          percent: 0,
        },
      }),
      plan({
        id: "p3",
        status: "COMPLETED",
        studentName: "Nina Azevedo",
        title: "Plano encerrado",
        progress: {
          totalGoals: 3,
          achievedGoals: 3,
          inProgressGoals: 0,
          percent: 100,
        },
      }),
    ];
  });

  it("mostra cabeçalho, hero, seções e itens (AC-PLN-01-01)", async () => {
    await render(<PlansHubScreen />);

    expect(screen.getByRole("header", { name: "Planos com IA" })).toBeTruthy();
    expect(screen.getByText("PDI e planejamento educacional")).toBeTruthy();
    expect(
      screen.getByText("Planejamento conectado à evolução real"),
    ).toBeTruthy();
    expect(screen.getByText("Em andamento")).toBeTruthy();
    expect(screen.getByText("Encerrados")).toBeTruthy();
    expect(screen.getByText("Lia Monteiro")).toBeTruthy();
    expect(screen.getByText("Caio Mendes")).toBeTruthy();
    expect(screen.getByText("Nina Azevedo")).toBeTruthy();
    expect(screen.getByText("PDI · Plano de leitura")).toBeTruthy();
    expect(screen.getByText("PE · Sessão de escrita")).toBeTruthy();
    expect(screen.getByText("25%")).toBeTruthy();
    expect(screen.getByText("100%")).toBeTruthy();
  });

  it("mostra a próxima revisão como dd/mm sem converter fuso", async () => {
    await render(<PlansHubScreen />);

    expect(screen.getByText("Próxima revisão: 05/11")).toBeTruthy();
    expect(screen.queryAllByText(/Próxima revisão/)).toHaveLength(1);
  });

  it("filtra por tipo", async () => {
    await render(<PlansHubScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "PE" }));
    expect(screen.queryByText("Lia Monteiro")).toBeNull();
    expect(screen.getByText("Caio Mendes")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "PDI" }));
    expect(screen.getByText("Lia Monteiro")).toBeTruthy();
    expect(screen.queryByText("Caio Mendes")).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Todos" }));
    expect(screen.getByText("Caio Mendes")).toBeTruthy();
  });

  it("abre o plano e o novo plano pelos destinos provisórios (AC-PLN-01-02)", async () => {
    await render(<PlansHubScreen />);

    await fireEvent.press(
      screen.getByRole("button", { name: /Lia Monteiro, PDI/ }),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Criar novo plano" }),
    );

    expect(push).toHaveBeenCalledWith(planDetailRoute("p1"));
    expect(push).toHaveBeenCalledWith(NEW_PLAN_ROUTE);
    expect(NEW_PLAN_ROUTE).toEqual({
      pathname: "/shell/coming-soon",
      params: { title: "Novo plano" },
    });
    expect(planDetailRoute("p1")).toEqual({
      pathname: "/shell/coming-soon",
      params: { title: "Detalhe do plano" },
    });
  });

  it("volta pelo botão do cabeçalho", async () => {
    await render(<PlansHubScreen />);

    await fireEvent.press(screen.getByRole("button", { name: /Voltar/ }));

    expect(back).toHaveBeenCalled();
  });

  it("mostra carregando (AC-PLN-01-03)", async () => {
    plans = undefined;
    pending = true;
    await render(<PlansHubScreen />);

    expect(screen.getByText("Carregando planos...")).toBeTruthy();
  });

  it("mostra erro com Tentar de novo (AC-PLN-01-03)", async () => {
    plans = undefined;
    failed = true;
    await render(<PlansHubScreen />);

    expect(
      screen.getByText("Não foi possível carregar os planos."),
    ).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Tentar de novo" }),
    );
    expect(refetch).toHaveBeenCalled();
  });

  it("mostra o vazio com o atalho de criação (AC-PLN-01-03)", async () => {
    plans = [];
    await render(<PlansHubScreen />);

    expect(screen.getByText("Nenhum plano ainda")).toBeTruthy();
    expect(screen.queryByText("Em andamento")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Criar novo plano" }),
    ).toBeTruthy();
  });

  it("avisa quando está offline e mantém a lista salva", async () => {
    online.value = false;
    await render(<PlansHubScreen />);

    expect(
      screen.getByText("Sem conexão - mostrando dados salvos"),
    ).toBeTruthy();
    expect(screen.getByText("Lia Monteiro")).toBeTruthy();
  });
});

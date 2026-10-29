import { beforeEach, describe, expect, it, vi } from "vitest";
import { Alert } from "react-native";
import { ApiError } from "@/api/errors";
import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import { mockPlans } from "@/mocks/handlers/plans";

const router = { back: vi.fn() };
const getPlan = vi.fn();
const listPlanReviews = vi.fn();
const updateGoalStatus = vi.fn();
const updatePlan = vi.fn();
const createPlanReview = vi.fn();
const updatePlanStatus = vi.fn();
vi.mock("expo-router", () => ({
  useRouter: () => router,
  useLocalSearchParams: () => ({ id: "mock-plan-1" }),
}));
vi.mock("@/api/endpoints/plans", () => ({
  getPlan: (...args: unknown[]) => getPlan(...args),
  listPlanReviews: (...args: unknown[]) => listPlanReviews(...args),
  updateGoalStatus: (...args: unknown[]) => updateGoalStatus(...args),
  updatePlan: (...args: unknown[]) => updatePlan(...args),
  createPlanReview: (...args: unknown[]) => createPlanReview(...args),
  updatePlanStatus: (...args: unknown[]) => updatePlanStatus(...args),
}));
vi.mock("@/features/students/useStudents", () => ({
  useStudents: () => ({ data: [{ id: "student-1", name: "Lia" }] }),
}));
const { PlanDetailScreen } = await import("../PlanDetailScreen");

describe("PlanDetailScreen (PLN-04)", () => {
  beforeEach(() => {
    getPlan.mockReset().mockResolvedValue(structuredClone(mockPlans[0]));
    listPlanReviews.mockReset().mockResolvedValue([]);
    updateGoalStatus.mockReset();
    updatePlan.mockReset();
    createPlanReview.mockReset();
    updatePlanStatus.mockReset();
    router.back.mockReset();
  });

  it("mostra metas, progresso, vigência e revisão", async () => {
    await render(<PlanDetailScreen />);
    expect(await screen.findByText("PDI de leitura e escrita")).toBeTruthy();
    expect(screen.getByText("Lia")).toBeTruthy();
    expect(screen.getByText("1 de 4 metas atingidas")).toBeTruthy();
    expect(screen.getByText("Ler frases curtas sem apoio")).toBeTruthy();
    expect(screen.getByText(/Próxima revisão: 05\/11\/2026/)).toBeTruthy();
  });

  it("atualiza progresso com a resposta da mudança da meta", async () => {
    const changed = structuredClone(mockPlans[0]);
    changed.goals[1].status = "ACHIEVED";
    changed.progress = {
      totalGoals: 4,
      achievedGoals: 2,
      inProgressGoals: 0,
      percent: 50,
    };
    updateGoalStatus.mockResolvedValue(changed);
    await render(<PlanDetailScreen />);
    await screen.findByText("PDI de leitura e escrita");
    await fireEvent.press(
      screen.getByRole("button", { name: "Alterar status da meta 2" }),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Atingida" }));
    await waitFor(() =>
      expect(updateGoalStatus).toHaveBeenCalledWith(
        "mock-plan-1",
        changed.goals[1].id,
        "ACHIEVED",
      ),
    );
    expect(await screen.findByText("2 de 4 metas atingidas")).toBeTruthy();
  });

  it("envia a lista completa de metas com IDs ao editar", async () => {
    updatePlan.mockImplementation(async (_id, input) => ({
      ...mockPlans[0],
      ...input,
    }));
    await render(<PlanDetailScreen />);
    await screen.findByText("PDI de leitura e escrita");
    await fireEvent.press(screen.getByRole("button", { name: "Editar plano" }));
    expect(
      screen.getByRole("button", { name: "Remover meta 1" }).props
        .accessibilityState.disabled,
    ).toBe(true);
    await fireEvent.changeText(
      screen.getByLabelText("Título"),
      "PDI atualizado",
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar alterações" }),
    );
    await waitFor(() =>
      expect(updatePlan).toHaveBeenCalledWith(
        "mock-plan-1",
        expect.objectContaining({
          title: "PDI atualizado",
          goals: mockPlans[0].goals.map((goal) =>
            expect.objectContaining({ id: goal.id }),
          ),
        }),
      ),
    );
  });

  it.each([
    [404, "PLAN_NOT_FOUND", "Plano não encontrado"],
    [403, "UNAUTHORIZED", "Sem acesso a este plano"],
  ])("mostra estado específico de %i", async (status, code, message) => {
    getPlan.mockRejectedValue(
      new ApiError({
        message: code,
        status,
        code,
      }),
    );
    await render(<PlanDetailScreen />);
    expect(await screen.findByText(message)).toBeTruthy();
    await fireEvent.press(
      screen.getAllByRole("button", { name: "Voltar" }).at(-1)!,
    );
    expect(router.back).toHaveBeenCalled();
  });

  it("registra revisão e mostra o retrato na lista", async () => {
    const review = {
      id: "r1",
      planId: "mock-plan-1",
      reviewedAt: "2026-10-29T12:00:00Z",
      note: "Boa evolução",
      goalStatuses: mockPlans[0].goals.map(({ id, status }) => ({
        goalId: id,
        status,
      })),
    };
    createPlanReview.mockResolvedValue(review);
    await render(<PlanDetailScreen />);
    await screen.findByText("PDI de leitura e escrita");
    await fireEvent.press(
      screen.getByRole("button", { name: "Registrar revisão" }),
    );
    await fireEvent.changeText(
      screen.getByLabelText("Nota da revisão"),
      "Boa evolução",
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar revisão" }),
    );
    await waitFor(() =>
      expect(createPlanReview).toHaveBeenCalledWith("mock-plan-1", {
        note: "Boa evolução",
      }),
    );
    expect(await screen.findByText("Boa evolução")).toBeTruthy();
  });

  it("confirma encerramento e deixa a tela somente leitura", async () => {
    const closed = {
      ...mockPlans[0],
      status: "COMPLETED",
      closedAt: "2026-10-29T12:00:00Z",
    };
    updatePlanStatus.mockResolvedValue(closed);
    const alert = vi
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _message, buttons) => {
        buttons?.find((button) => button.text === "Confirmar")?.onPress?.();
      });
    await render(<PlanDetailScreen />);
    await screen.findByText("PDI de leitura e escrita");
    await fireEvent.press(
      screen.getByRole("button", { name: "Encerrar plano" }),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Concluído" }));
    await waitFor(() =>
      expect(updatePlanStatus).toHaveBeenCalledWith("mock-plan-1", "COMPLETED"),
    );
    expect(alert).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining("Não é possível reabrir"),
      expect.any(Array),
    );
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Editar plano" })).toBeNull(),
    );
    alert.mockRestore();
  });
});

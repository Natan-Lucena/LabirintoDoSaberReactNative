import { beforeEach, describe, expect, it, vi } from "vitest";
import { Alert } from "react-native";
import { ApiError } from "@/api/errors";
import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import { mockPlans } from "@/mocks/handlers/plans";

const router = { back: vi.fn(), push: vi.fn() };
const getPlan = vi.fn();
const listPlanReviews = vi.fn();
const updateGoalStatus = vi.fn();
const updatePlan = vi.fn();
const createPlanReview = vi.fn();
const updatePlanStatus = vi.fn();
const generatePlanSuggestions = vi.fn();
const listPlanSuggestions = vi.fn();
const acceptPlanSuggestion = vi.fn();
const dismissPlanSuggestion = vi.fn();
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
  generatePlanSuggestions: (...args: unknown[]) =>
    generatePlanSuggestions(...args),
  listPlanSuggestions: (...args: unknown[]) => listPlanSuggestions(...args),
  acceptPlanSuggestion: (...args: unknown[]) => acceptPlanSuggestion(...args),
  dismissPlanSuggestion: (...args: unknown[]) => dismissPlanSuggestion(...args),
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
    router.push.mockReset();
    generatePlanSuggestions.mockReset();
    listPlanSuggestions.mockReset().mockResolvedValue([]);
    acceptPlanSuggestion.mockReset();
    dismissPlanSuggestion.mockReset();
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

describe("PlanDetailScreen — sugestões da IA (PLN-05)", () => {
  const suggestion = (id: string, planId = "mock-plan-1") => ({
    id,
    planId,
    studentId: "student-1",
    studentName: "Lia",
    goalId: "mock-plan-1-goal-2",
    kind: "UPDATE_GOAL_STATUS" as const,
    text: "Avanço recente.",
    proposedChange: { status: "ACHIEVED" as const },
    status: "PENDING" as const,
    createdAt: "2026-10-28T12:00:00.000Z",
  });
  beforeEach(() => {
    getPlan.mockReset().mockResolvedValue(structuredClone(mockPlans[0]));
    listPlanReviews.mockReset().mockResolvedValue([]);
    router.push.mockReset();
    generatePlanSuggestions.mockReset();
    listPlanSuggestions.mockReset().mockResolvedValue([]);
    acceptPlanSuggestion.mockReset();
    dismissPlanSuggestion.mockReset();
  });

  it("AC-PLN-05-01 mostra a mensagem quando não há sugestões novas", async () => {
    generatePlanSuggestions.mockResolvedValue([]);
    await render(<PlanDetailScreen />);
    await screen.findByText("PDI de leitura e escrita");
    await fireEvent.press(
      screen.getByRole("button", { name: "Pedir sugestões da IA" }),
    );
    await waitFor(() =>
      expect(generatePlanSuggestions).toHaveBeenCalledWith("mock-plan-1"),
    );
    expect(
      await screen.findByText("Sem sugestões novas para este plano"),
    ).toBeTruthy();
  });

  it("AC-PLN-05-01 anuncia as novas e leva à tela de sugestões", async () => {
    generatePlanSuggestions.mockResolvedValue([
      suggestion("s-1"),
      suggestion("s-2"),
    ]);
    await render(<PlanDetailScreen />);
    await screen.findByText("PDI de leitura e escrita");
    await fireEvent.press(
      screen.getByRole("button", { name: "Pedir sugestões da IA" }),
    );
    expect(
      (await screen.findAllByText("2 sugestões novas")).length,
    ).toBeGreaterThan(0);
    await fireEvent.press(
      screen.getByRole("button", { name: "Ver sugestões" }),
    );
    expect(router.push).toHaveBeenCalledWith("/plans/suggestions");
  });

  it("mostra o texto de espera durante a geração", async () => {
    let finish: (value: unknown[]) => void = () => undefined;
    generatePlanSuggestions.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    await render(<PlanDetailScreen />);
    await screen.findByText("PDI de leitura e escrita");
    await fireEvent.press(
      screen.getByRole("button", { name: "Pedir sugestões da IA" }),
    );
    expect(await screen.findByText("Gerando sugestões…")).toBeTruthy();
    finish([]);
    expect(
      await screen.findByText("Sem sugestões novas para este plano"),
    ).toBeTruthy();
  });

  it("erro AI_* mostra a mensagem e não reenvia sozinho", async () => {
    generatePlanSuggestions.mockRejectedValue(
      new ApiError({
        message: "AI_GENERATION_FAILED",
        status: 500,
        code: "AI_GENERATION_FAILED",
      }),
    );
    await render(<PlanDetailScreen />);
    await screen.findByText("PDI de leitura e escrita");
    await fireEvent.press(
      screen.getByRole("button", { name: "Pedir sugestões da IA" }),
    );
    expect(
      await screen.findByText(
        "Não foi possível gerar agora. Tente de novo em instantes.",
      ),
    ).toBeTruthy();
    expect(generatePlanSuggestions).toHaveBeenCalledTimes(1);
  });

  it("AC-PLN-05-02 lista só as pendentes do plano e aceitar aplica a mudança", async () => {
    listPlanSuggestions.mockResolvedValueOnce([
      suggestion("s-1"),
      { ...suggestion("s-2", "mock-plan-2"), text: "Outro plano." },
    ]);
    listPlanSuggestions.mockResolvedValue([]);
    const changed = structuredClone(mockPlans[0]);
    changed.goals[1].status = "ACHIEVED";
    changed.progress = {
      totalGoals: 4,
      achievedGoals: 2,
      inProgressGoals: 0,
      percent: 50,
    };
    acceptPlanSuggestion.mockResolvedValue(changed);
    getPlan
      .mockReset()
      .mockResolvedValueOnce(structuredClone(mockPlans[0]))
      .mockResolvedValue(changed);
    await render(<PlanDetailScreen />);
    expect(await screen.findByText("Avanço recente.")).toBeTruthy();
    expect(screen.queryByText("Outro plano.")).toBeNull();
    // PLN-05: a mudança diz qual meta muda.
    expect(
      screen.getByText(
        "Mudar a meta “Escrever frases com letra maiúscula” para Atingida",
      ),
    ).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: /Aceitar sugestão/ }),
    );
    await waitFor(() =>
      expect(acceptPlanSuggestion).toHaveBeenCalledWith("s-1"),
    );
    expect(await screen.findByText("2 de 4 metas atingidas")).toBeTruthy();
    await waitFor(() =>
      expect(screen.queryByText("Avanço recente.")).toBeNull(),
    );
  });

  it("descartar chama a rota e tira a sugestão da lista", async () => {
    listPlanSuggestions.mockResolvedValueOnce([suggestion("s-1")]);
    listPlanSuggestions.mockResolvedValue([]);
    dismissPlanSuggestion.mockResolvedValue({
      ...suggestion("s-1"),
      status: "DISMISSED",
    });
    await render(<PlanDetailScreen />);
    await screen.findByText("Avanço recente.");
    await fireEvent.press(
      screen.getByRole("button", { name: /Descartar sugestão/ }),
    );
    await waitFor(() =>
      expect(dismissPlanSuggestion).toHaveBeenCalledWith("s-1"),
    );
    await waitFor(() =>
      expect(screen.queryByText("Avanço recente.")).toBeNull(),
    );
  });

  it("não oferece o botão em plano encerrado", async () => {
    getPlan.mockResolvedValue({ ...mockPlans[0], status: "COMPLETED" });
    await render(<PlanDetailScreen />);
    await screen.findByText("PDI de leitura e escrita");
    expect(
      screen.queryByRole("button", { name: "Pedir sugestões da IA" }),
    ).toBeNull();
  });
});

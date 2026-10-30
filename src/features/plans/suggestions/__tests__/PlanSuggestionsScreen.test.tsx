import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import type { PlanSuggestion } from "@/api/types";
import { fireEvent, render, screen, waitFor } from "@/test-utils/render";

const router = { back: vi.fn() };
const listPlanSuggestions = vi.fn();
const acceptPlanSuggestion = vi.fn();
const dismissPlanSuggestion = vi.fn();
const getPlan = vi.fn();

vi.mock("expo-router", () => ({ useRouter: () => router }));
vi.mock("@/api/endpoints/plans", () => ({
  listPlanSuggestions: (...args: unknown[]) => listPlanSuggestions(...args),
  acceptPlanSuggestion: (...args: unknown[]) => acceptPlanSuggestion(...args),
  dismissPlanSuggestion: (...args: unknown[]) => dismissPlanSuggestion(...args),
  getPlan: (...args: unknown[]) => getPlan(...args),
}));
vi.mock("@/features/plans/hub/usePlans", () => ({
  planQueryKeys: { all: ["plan"] },
  usePlans: () => ({
    data: [{ id: "mock-plan-1", title: "PDI de leitura e escrita" }],
  }),
}));

const { PlanSuggestionsScreen } = await import("../PlanSuggestionsScreen");

function suggestion(
  id: string,
  overrides: Partial<PlanSuggestion> = {},
): PlanSuggestion {
  return {
    id,
    planId: "mock-plan-1",
    studentId: "student-1",
    studentName: "Lia",
    kind: "UPDATE_GOAL_STATUS",
    goalId: "goal-1",
    text: `Texto ${id}`,
    proposedChange: { status: "ACHIEVED" },
    status: "PENDING",
    createdAt: "2026-10-28T12:00:00.000Z",
    ...overrides,
  };
}

describe("PlanSuggestionsScreen (PLN-05)", () => {
  beforeEach(() => {
    router.back.mockReset();
    listPlanSuggestions.mockReset();
    acceptPlanSuggestion.mockReset();
    dismissPlanSuggestion.mockReset();
    getPlan.mockReset().mockResolvedValue({
      id: "mock-plan-1",
      goals: [{ id: "goal-1", description: "Ler frases curtas" }],
    });
  });

  it("mostra paciente, plano, texto e a mudança em linguagem simples", async () => {
    listPlanSuggestions.mockResolvedValue([
      suggestion("s-1"),
      suggestion("s-2", {
        kind: "ADD_GOAL",
        goalId: undefined,
        proposedChange: { description: "Ler em voz alta" },
      }),
      suggestion("s-3", {
        kind: "REWRITE_GOAL",
        proposedChange: { description: "Ler frases longas" },
      }),
      suggestion("s-4", {
        kind: "SCHEDULE_REVIEW",
        goalId: undefined,
        proposedChange: { nextReviewDate: "2026-11-20" },
      }),
    ]);
    await render(<PlanSuggestionsScreen />);
    expect(await screen.findByText("Texto s-1")).toBeTruthy();
    expect(listPlanSuggestions).toHaveBeenCalledWith("PENDING");
    expect(screen.getAllByText("Lia")).toHaveLength(4);
    expect(screen.getAllByText("PDI de leitura e escrita")).toHaveLength(4);
    // PLN-05: a mudança diz qual meta muda.
    expect(
      await screen.findByText("Mudar a meta “Ler frases curtas” para Atingida"),
    ).toBeTruthy();
    expect(screen.getByText("Nova meta: Ler em voz alta")).toBeTruthy();
    expect(
      screen.getByText(
        "Reescrever a meta “Ler frases curtas” como: Ler frases longas",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Agendar revisão para 20/11/2026")).toBeTruthy();
  });

  it("mostra o estado vazio", async () => {
    listPlanSuggestions.mockResolvedValue([]);
    await render(<PlanSuggestionsScreen />);
    expect(
      await screen.findByText("Nenhuma sugestão para revisar"),
    ).toBeTruthy();
  });

  it("AC-PLN-05-02 aceitar chama a rota e tira a sugestão da lista", async () => {
    listPlanSuggestions.mockResolvedValueOnce([suggestion("s-1")]);
    listPlanSuggestions.mockResolvedValue([]);
    acceptPlanSuggestion.mockResolvedValue({ id: "mock-plan-1" });
    await render(<PlanSuggestionsScreen />);
    await screen.findByText("Texto s-1");
    await fireEvent.press(
      screen.getByRole("button", { name: /Aceitar sugestão/ }),
    );
    await waitFor(() =>
      expect(acceptPlanSuggestion).toHaveBeenCalledWith("s-1"),
    );
    await waitFor(() => expect(screen.queryByText("Texto s-1")).toBeNull());
    expect(
      await screen.findByText("Nenhuma sugestão para revisar"),
    ).toBeTruthy();
  });

  it("AC-PLN-05-02 descartar chama a rota e tira a sugestão da lista", async () => {
    listPlanSuggestions.mockResolvedValueOnce([suggestion("s-1")]);
    listPlanSuggestions.mockResolvedValue([]);
    dismissPlanSuggestion.mockResolvedValue(
      suggestion("s-1", { status: "DISMISSED" }),
    );
    await render(<PlanSuggestionsScreen />);
    await screen.findByText("Texto s-1");
    await fireEvent.press(
      screen.getByRole("button", { name: /Descartar sugestão/ }),
    );
    await waitFor(() =>
      expect(dismissPlanSuggestion).toHaveBeenCalledWith("s-1"),
    );
    await waitFor(() => expect(screen.queryByText("Texto s-1")).toBeNull());
  });

  it("AC-PLN-05-03 SUGGESTION_NOT_APPLICABLE avisa e remove a sugestão", async () => {
    listPlanSuggestions.mockResolvedValueOnce([
      suggestion("s-1"),
      suggestion("s-2"),
    ]);
    listPlanSuggestions.mockResolvedValue([suggestion("s-2")]);
    acceptPlanSuggestion.mockRejectedValue(
      new ApiError({
        message: "SUGGESTION_NOT_APPLICABLE",
        status: 409,
        code: "SUGGESTION_NOT_APPLICABLE",
      }),
    );
    await render(<PlanSuggestionsScreen />);
    await screen.findByText("Texto s-1");
    await fireEvent.press(
      screen.getAllByRole("button", { name: /Aceitar sugestão/ })[0]!,
    );
    expect(
      await screen.findByText("Esta sugestão não se aplica mais"),
    ).toBeTruthy();
    await waitFor(() => expect(screen.queryByText("Texto s-1")).toBeNull());
    expect(screen.getByText("Texto s-2")).toBeTruthy();
  });

  it("SUGGESTION_ALREADY_RESOLVED atualiza a lista", async () => {
    listPlanSuggestions.mockResolvedValueOnce([suggestion("s-1")]);
    listPlanSuggestions.mockResolvedValue([]);
    dismissPlanSuggestion.mockRejectedValue(
      new ApiError({
        message: "SUGGESTION_ALREADY_RESOLVED",
        status: 409,
        code: "SUGGESTION_ALREADY_RESOLVED",
      }),
    );
    await render(<PlanSuggestionsScreen />);
    await screen.findByText("Texto s-1");
    await fireEvent.press(
      screen.getByRole("button", { name: /Descartar sugestão/ }),
    );
    await waitFor(() => expect(screen.queryByText("Texto s-1")).toBeNull());
    expect(screen.getByText("Esta sugestão já foi resolvida")).toBeTruthy();
  });

  it("mostra erro de carregamento com nova tentativa", async () => {
    listPlanSuggestions.mockRejectedValueOnce(
      new ApiError({ message: "UNAUTHORIZED", status: 403 }),
    );
    listPlanSuggestions.mockResolvedValue([]);
    await render(<PlanSuggestionsScreen />);
    expect(
      await screen.findByText("Não foi possível carregar as sugestões."),
    ).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Tentar de novo" }),
    );
    expect(
      await screen.findByText("Nenhuma sugestão para revisar"),
    ).toBeTruthy();
  });
});

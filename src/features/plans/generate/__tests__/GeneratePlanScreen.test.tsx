import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@/test-utils/render";

const params = vi.hoisted(() => ({
  studentId: undefined as string | undefined,
}));
const generate = vi.fn();
const listPlans = vi.fn();
const responses = vi.fn();
const templates = vi.fn();

vi.mock("expo-router", () => ({
  useRouter: () => ({ back: vi.fn() }),
  useLocalSearchParams: () => params,
}));
vi.mock("@/features/students/useStudents", () => ({
  useStudents: () => ({
    data: [
      { id: "student-1", name: "Lia", learningTopics: ["leitura", "escrita"] },
    ],
    isError: false,
  }),
}));
vi.mock("@/api/endpoints/plans", () => ({
  generatePlanDraft: (...args: unknown[]) => generate(...args),
  listPlans: (...args: unknown[]) => listPlans(...args),
}));
vi.mock("@/api/endpoints/anamnese-responses", () => ({
  listAnamneseResponsesByStudent: (...args: unknown[]) => responses(...args),
}));
vi.mock("@/api/endpoints/anamnese", () => ({
  listAnamneseTemplates: (...args: unknown[]) => templates(...args),
}));

const { GeneratePlanScreen } = await import("../GeneratePlanScreen");

describe("GeneratePlanScreen (PLN-02)", () => {
  beforeEach(() => {
    params.studentId = undefined;
    generate.mockReset();
    listPlans.mockReset().mockResolvedValue([]);
    responses.mockReset().mockResolvedValue([]);
    templates.mockReset().mockResolvedValue([]);
  });

  it("pede paciente quando a rota não traz studentId", async () => {
    await render(<GeneratePlanScreen />);
    expect(screen.getByRole("button", { name: "Paciente" })).toBeTruthy();
    expect(screen.queryByText("Dificuldades consideradas")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Paciente" }));
    await fireEvent.press(screen.getByRole("button", { name: "Lia" }));
    expect(screen.getByText("Dificuldades consideradas")).toBeTruthy();
  });

  it("marca dificuldades e bloqueia geração se todas forem desmarcadas", async () => {
    params.studentId = "student-1";
    await render(<GeneratePlanScreen />);
    expect(
      screen.getByRole("checkbox", { name: "leitura" }).props.accessibilityState
        .checked,
    ).toBe(true);
    await fireEvent.press(screen.getByRole("checkbox", { name: "leitura" }));
    await fireEvent.press(screen.getByRole("checkbox", { name: "escrita" }));
    await fireEvent.changeText(
      screen.getByLabelText("Foco do planejamento"),
      "Leitura",
    );
    expect(
      screen.getByRole("button", { name: "Gerar planejamento com IA" }).props
        .accessibilityState.disabled,
    ).toBe(true);
    expect(generate).not.toHaveBeenCalled();
  });

  it("envia PDI de 3 meses e mostra rascunho sem salvar", async () => {
    params.studentId = "student-1";
    generate.mockResolvedValue({
      type: "PDI",
      title: "PDI de leitura",
      generalObjective: "Ler frases",
      goals: [{ description: "Ler frases", successCriterion: "Lê 5 frases" }],
      suggestedStartDate: "2026-10-29",
      suggestedEndDate: "2027-01-29",
      suggestedNextReviewDate: "2026-11-29",
      rationale: "Com base nas dificuldades.",
    });
    await render(<GeneratePlanScreen />);
    await fireEvent.changeText(
      screen.getByLabelText("Foco do planejamento"),
      "Leitura",
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Gerar planejamento com IA" }),
    );
    await waitFor(() =>
      expect(generate).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: "student-1",
          type: "PDI",
          durationMonths: 3,
          consideredDifficulties: ["leitura", "escrita"],
        }),
        expect.anything(),
      ),
    );
    expect(screen.getByText("Rascunho não salvo")).toBeTruthy();
    expect(screen.getByText("Por que essas metas")).toBeTruthy();
  });

  it("envia PE com data e PDI ativo", async () => {
    params.studentId = "student-1";
    listPlans.mockResolvedValue([{ id: "plan-1", title: "PDI ativo" }]);
    generate.mockResolvedValue({
      type: "PE",
      title: "PE",
      generalObjective: "Leitura",
      goals: [],
      suggestedStartDate: "2026-10-29",
      suggestedEndDate: "2026-10-29",
    });
    await render(<GeneratePlanScreen />);
    await fireEvent.press(screen.getByRole("radio", { name: "PE da sessão" }));
    await waitFor(() =>
      expect(screen.getByText("Baseado no PDI: PDI ativo")).toBeTruthy(),
    );
    await fireEvent.changeText(
      screen.getByLabelText("Foco do planejamento"),
      "Leitura",
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Gerar planejamento com IA" }),
    );
    await waitFor(() =>
      expect(generate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "PE",
          parentPlanId: "plan-1",
          sessionDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        }),
        expect.anything(),
      ),
    );
    expect(generate.mock.calls[0]?.[0]).not.toHaveProperty("durationMonths");
  });

  it("mostra falha de IA e só tenta de novo por toque", async () => {
    params.studentId = "student-1";
    generate.mockRejectedValue({ code: "AI_GENERATION_FAILED" });
    await render(<GeneratePlanScreen />);
    await fireEvent.changeText(
      screen.getByLabelText("Foco do planejamento"),
      "Leitura",
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Gerar planejamento com IA" }),
    );
    await waitFor(() =>
      expect(
        screen.getByText(
          "Não foi possível gerar agora. Tente de novo em instantes.",
        ),
      ).toBeTruthy(),
    );
    expect(generate).toHaveBeenCalledTimes(1);
    await fireEvent.press(
      screen.getByRole("button", { name: "Tentar de novo" }),
    );
    await waitFor(() => expect(generate).toHaveBeenCalledTimes(2));
  });

  it("mostra carregamento e erro de timeout sem reenvio automático", async () => {
    params.studentId = "student-1";
    let rejectRequest: (reason?: unknown) => void = () => undefined;
    generate.mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectRequest = reject;
        }),
    );
    await render(<GeneratePlanScreen />);
    await fireEvent.changeText(
      screen.getByLabelText("Foco do planejamento"),
      "Leitura",
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Gerar planejamento com IA" }),
    );
    await waitFor(() =>
      expect(screen.getByText("Gerando o planejamento…")).toBeTruthy(),
    );
    rejectRequest({ isTimeout: true });
    await waitFor(() =>
      expect(
        screen.getByText(
          "A geração demorou mais que o esperado. Tente de novo.",
        ),
      ).toBeTruthy(),
    );
    expect(generate).toHaveBeenCalledTimes(1);
  });
});

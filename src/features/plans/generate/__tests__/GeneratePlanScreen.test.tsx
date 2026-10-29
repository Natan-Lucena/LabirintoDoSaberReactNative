import { beforeEach, describe, expect, it, vi } from "vitest";
import { Alert, Share } from "react-native";
import { fireEvent, render, screen, waitFor } from "@/test-utils/render";

const params = vi.hoisted(() => ({
  studentId: undefined as string | undefined,
}));
const generate = vi.fn();
const create = vi.fn();
const router = { back: vi.fn(), replace: vi.fn(), push: vi.fn() };
const navigation = { addListener: vi.fn(), dispatch: vi.fn() };
const listPlans = vi.fn();
const responses = vi.fn();
const templates = vi.fn();

vi.mock("expo-router", () => ({
  useRouter: () => router,
  useNavigation: () => navigation,
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
  PlanApiError: class PlanApiError extends Error {
    code: string;
    activePlanId?: string;
    constructor(input: {
      message: string;
      code: string;
      activePlanId?: string;
    }) {
      super(input.message);
      this.code = input.code;
      this.activePlanId = input.activePlanId;
    }
  },
  generatePlanDraft: (...args: unknown[]) => generate(...args),
  createPlan: (...args: unknown[]) => create(...args),
  listPlans: (...args: unknown[]) => listPlans(...args),
}));
vi.mock("@/api/endpoints/anamnese-responses", () => ({
  listAnamneseResponsesByStudent: (...args: unknown[]) => responses(...args),
}));
vi.mock("@/api/endpoints/anamnese", () => ({
  listAnamneseTemplates: (...args: unknown[]) => templates(...args),
}));

const { GeneratePlanScreen } = await import("../GeneratePlanScreen");
const editableDraft = {
  type: "PDI",
  title: "PDI de leitura",
  generalObjective: "Ler frases",
  goals: [{ description: "Ler frases", successCriterion: "Lê 5 frases" }],
  suggestedStartDate: "2026-10-29",
  suggestedEndDate: "2027-01-29",
  suggestedNextReviewDate: "2026-11-29",
  rationale: "Com base nas dificuldades.",
};

async function generateEditableDraft() {
  params.studentId = "student-1";
  generate.mockResolvedValue(editableDraft);
  await render(<GeneratePlanScreen />);
  await fireEvent.changeText(
    screen.getByLabelText("Foco do planejamento"),
    "Leitura",
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Gerar planejamento com IA" }),
  );
  await waitFor(() => expect(screen.getByLabelText("Título")).toBeTruthy());
}

describe("GeneratePlanScreen (PLN-02)", () => {
  beforeEach(() => {
    params.studentId = undefined;
    generate.mockReset();
    create.mockReset();
    router.replace.mockReset();
    router.push.mockReset();
    navigation.addListener.mockReset().mockReturnValue(() => undefined);
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

  it("edita, adiciona e reordena metas antes de salvar com as datas sugeridas", async () => {
    create.mockResolvedValue({ id: "new-plan" });
    await generateEditableDraft();
    await fireEvent.changeText(screen.getByLabelText("Título"), "PDI revisado");
    await fireEvent.changeText(
      screen.getByLabelText("Objetivo geral"),
      "Ler sem apoio",
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Adicionar meta" }),
    );
    await fireEvent.changeText(
      screen.getByLabelText("Descrição da meta 2"),
      "Escrever frases",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Subir meta 2" }));
    await fireEvent.press(screen.getByRole("button", { name: "Salvar PDI" }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          source: "AI",
          title: "PDI revisado",
          generalObjective: "Ler sem apoio",
          startDate: "2026-10-29",
          endDate: "2027-01-29",
          nextReviewDate: "2026-11-29",
          goals: [
            { description: "Escrever frases" },
            { description: "Ler frases", successCriterion: "Lê 5 frases" },
          ],
        }),
      ),
    );
    expect(screen.getByText("Plano salvo")).toBeTruthy();
  });

  it("compartilha uma síntese com metas numeradas", async () => {
    const share = vi
      .spyOn(Share, "share")
      .mockResolvedValue({ action: "sharedAction" });
    await generateEditableDraft();
    await fireEvent.press(screen.getByRole("button", { name: "Compartilhar" }));
    expect(share).toHaveBeenCalledWith({
      message: "PDI de leitura\nLer frases\nMetas:\n1. Ler frases",
    });
    share.mockRestore();
  });

  it("mostra o PDI ativo no 409 e conserva os campos do rascunho", async () => {
    const { PlanApiError } = await import("@/api/endpoints/plans");
    create.mockRejectedValue(
      new PlanApiError({
        message: "ACTIVE_PDI_ALREADY_EXISTS",
        status: 409,
        code: "ACTIVE_PDI_ALREADY_EXISTS",
        activePlanId: "mock-plan-1",
      }),
    );
    await generateEditableDraft();
    await fireEvent.changeText(screen.getByLabelText("Título"), "Meu rascunho");
    await fireEvent.press(screen.getByRole("button", { name: "Salvar PDI" }));
    await waitFor(() =>
      expect(
        screen.getByText("Este paciente já tem um PDI ativo."),
      ).toBeTruthy(),
    );
    expect(screen.getByLabelText("Título").props.value).toBe("Meu rascunho");
    await fireEvent.press(
      screen.getByRole("button", { name: "Ver PDI ativo" }),
    );
    expect(router.push).toHaveBeenCalled();
  });

  it("pede confirmação para sair com rascunho não salvo", async () => {
    const alert = vi.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await generateEditableDraft();
    const listener = navigation.addListener.mock.calls.at(-1)?.[1] as (event: {
      preventDefault: () => void;
      data: { action: object };
    }) => void;
    const preventDefault = vi.fn();
    listener({ preventDefault, data: { action: { type: "GO_BACK" } } });
    expect(preventDefault).toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith(
      "Descartar o rascunho?",
      expect.any(String),
      expect.any(Array),
    );
    alert.mockRestore();
  });
});

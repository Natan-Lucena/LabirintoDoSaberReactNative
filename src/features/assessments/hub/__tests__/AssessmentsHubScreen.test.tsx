import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ScaleApplicationSummary,
  ScaleTemplateSummary,
} from "@/api/types";
import { fireEvent, render, screen } from "@/test-utils/render";

const push = vi.fn();
const back = vi.fn();
const refetchTemplates = vi.fn();
const refetchApplications = vi.fn();
const online = vi.hoisted(() => ({ value: true }));
let templates: ScaleTemplateSummary[] | undefined;
let applications: ScaleApplicationSummary[] | undefined;
let failed = false;

vi.mock("expo-router", () => ({ useRouter: () => ({ push, back }) }));
vi.mock("@/hooks/useOnline", () => ({ useOnline: () => online.value }));
vi.mock("@/features/assessments/hub/useAssessmentsHub", () => ({
  useScaleTemplates: () => ({
    data: templates,
    isError: failed,
    isRefetching: false,
    refetch: refetchTemplates,
  }),
  useRecentApplications: () => ({
    data: applications,
    isError: false,
    isRefetching: false,
    refetch: refetchApplications,
  }),
}));

const { AssessmentsHubScreen } =
  await import("@/features/assessments/hub/AssessmentsHubScreen");
const { applyRoute, resultRoute } =
  await import("@/features/assessments/routes");

function template(
  overrides: Partial<ScaleTemplateSummary> & { id: string },
): ScaleTemplateSummary {
  return {
    code: "ESC",
    version: 1,
    name: "Escala de atenção",
    description: "",
    respondent: "PROFESSIONAL",
    estimatedMinutes: 8,
    itemCount: 18,
    active: true,
    ...overrides,
  };
}

function application(
  overrides: Partial<ScaleApplicationSummary> & { id: string },
): ScaleApplicationSummary {
  return {
    templateId: "t1",
    templateCode: "ESC",
    templateVersion: 1,
    templateName: "Escala de atenção",
    studentId: "s1",
    studentName: "Lia Monteiro",
    educatorId: "e1",
    status: "COMPLETED",
    score: {
      partial: false,
      answered: 18,
      total: 18,
      value: 30,
      max: 54,
      band: { label: "Indicativo alto", severity: "HIGH" },
      subscales: [],
    },
    disclaimer: "Triagem, não diagnóstico.",
    startedAt: "2026-11-01T12:00:00.000Z",
    updatedAt: "2026-11-03T12:00:00.000Z",
    completedAt: "2026-11-03T12:00:00.000Z",
    ...overrides,
  };
}

describe("AssessmentsHubScreen (AVA-01)", () => {
  beforeEach(() => {
    push.mockClear();
    back.mockClear();
    refetchTemplates.mockClear();
    refetchApplications.mockClear();
    online.value = true;
    failed = false;
    templates = [
      template({ id: "t1" }),
      template({ id: "t2", name: "Escala de humor", itemCount: 10 }),
      template({ id: "t3", name: "Escala antiga", active: false }),
    ];
    applications = [
      application({ id: "a1" }),
      application({
        id: "a2",
        studentId: "s2",
        studentName: "Caio Mendes",
        status: "DRAFT",
        completedAt: undefined,
        score: {
          partial: true,
          answered: 5,
          total: 18,
          value: 9,
          max: 54,
          band: { label: "Indicativo baixo", severity: "LOW" },
          subscales: [],
        },
      }),
    ];
  });

  it("mostra hero, modelos e aplicações vindos da API (AC-AVA-01-01)", async () => {
    await render(<AssessmentsHubScreen />);

    expect(screen.getByText("Nova aplicação")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Escolher escala" }),
    ).toBeTruthy();
    expect(screen.getByText("Modelos disponíveis")).toBeTruthy();
    expect(screen.getByText("Escala de atenção")).toBeTruthy();
    expect(screen.getByText("18 itens · 8 min")).toBeTruthy();
    expect(screen.getByText("10 itens · 8 min")).toBeTruthy();
    expect(screen.queryByText("Escala antiga")).toBeNull();
    expect(screen.getByText("Aplicações recentes")).toBeTruthy();
    expect(screen.getByText("Lia Monteiro")).toBeTruthy();
    expect(screen.getByText("Caio Mendes")).toBeTruthy();
  });

  it("Escolher escala não quebra e Aplicar escala abre a aplicação", async () => {
    await render(<AssessmentsHubScreen />);

    await fireEvent.press(
      screen.getByRole("button", { name: "Escolher escala" }),
    );
    await fireEvent.press(
      screen.getAllByRole("button", { name: "Aplicar escala" })[1],
    );

    expect(push).toHaveBeenCalledWith(applyRoute("t2"));
    expect(applyRoute("t2")).toEqual({
      pathname: "/assessments/apply/[templateId]",
      params: { templateId: "t2" },
    });
  });

  it("repassa o studentId recebido ao aplicar escala", async () => {
    await render(<AssessmentsHubScreen studentId="s9" />);

    await fireEvent.press(
      screen.getAllByRole("button", { name: "Aplicar escala" })[0],
    );

    expect(push).toHaveBeenCalledWith(applyRoute("t1", { studentId: "s9" }));
  });

  it("badge usa o label do servidor e marca a faixa do rascunho como parcial (AC-AVA-01-02)", async () => {
    await render(<AssessmentsHubScreen />);

    expect(screen.getByText("Indicativo alto")).toBeTruthy();
    expect(screen.getByText("Indicativo baixo (parcial)")).toBeTruthy();
  });

  it("rascunho tem Continuar e retoma o rascunho (AC-AVA-01-03)", async () => {
    await render(<AssessmentsHubScreen />);

    expect(screen.getAllByRole("button", { name: /^Continuar/ })).toHaveLength(
      1,
    );
    await fireEvent.press(screen.getByRole("button", { name: /^Continuar/ }));

    expect(push).toHaveBeenCalledWith(
      applyRoute("t1", { studentId: "s2", applicationId: "a2" }),
    );
    expect(applyRoute("t1", { applicationId: "a2" })).toEqual({
      pathname: "/assessments/apply/[templateId]",
      params: { templateId: "t1", applicationId: "a2" },
    });
  });

  it("aplicação concluída abre o resultado", async () => {
    await render(<AssessmentsHubScreen />);

    await fireEvent.press(
      screen.getByRole("button", { name: /Lia Monteiro, .*Indicativo alto/ }),
    );

    expect(push).toHaveBeenCalledWith(resultRoute("a1"));
    expect(resultRoute("a1")).toEqual({
      pathname: "/assessments/results/[id]",
      params: { id: "a1" },
    });
  });

  it("mostra carregando", async () => {
    templates = undefined;
    applications = undefined;
    await render(<AssessmentsHubScreen />);

    expect(screen.getByText("Carregando avaliações...")).toBeTruthy();
  });

  it("mostra erro com Tentar novamente", async () => {
    templates = undefined;
    applications = undefined;
    failed = true;
    await render(<AssessmentsHubScreen />);

    expect(
      screen.getByText("Não foi possível carregar as avaliações."),
    ).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );
    expect(refetchTemplates).toHaveBeenCalled();
    expect(refetchApplications).toHaveBeenCalled();
  });

  it("mostra os vazios", async () => {
    templates = [];
    applications = [];
    await render(<AssessmentsHubScreen />);

    expect(
      screen.getByText("Nenhuma escala disponível no momento"),
    ).toBeTruthy();
    expect(screen.getByText("Nenhuma aplicação ainda")).toBeTruthy();
  });

  it("avisa quando está offline e volta pelo cabeçalho", async () => {
    online.value = false;
    await render(<AssessmentsHubScreen />);

    expect(
      screen.getByText("Sem conexão - mostrando dados salvos"),
    ).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: /Voltar/ }));
    expect(back).toHaveBeenCalled();
  });
});

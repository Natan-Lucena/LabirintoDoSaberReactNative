import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlanSummary } from "@/api/types";
import { fireEvent, render, screen } from "@/test-utils/render";

const push = vi.fn();
const refetch = vi.fn();
let plans: PlanSummary[] | undefined;
let activePlans: PlanSummary[] | undefined;
let failed = false;

vi.mock("expo-router", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/features/patients/detail/plans/usePatientPlans", () => ({
  usePatientPlans: () => ({ data: plans, isError: failed, refetch }),
  useActivePdi: () => ({ data: activePlans, isError: failed, refetch }),
}));

const { PatientPlans, ActivePdi } =
  await import("@/features/patients/detail/plans/PatientPlans");
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
    nextReviewDate: "2026-11-05",
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

describe("PatientPlans (PAC-04)", () => {
  beforeEach(() => {
    push.mockClear();
    refetch.mockClear();
    failed = false;
    plans = [
      plan({ id: "closed", status: "COMPLETED", title: "Plano encerrado" }),
      plan({ id: "active" }),
      plan({
        id: "cancelled",
        status: "CANCELLED",
        type: "PE",
        title: "Sessão cancelada",
      }),
    ];
    activePlans = [plan({ id: "active" })];
  });

  it("lista planos do paciente com ativos primeiro, status, progresso e revisão (AC-PAC-04-01)", async () => {
    await render(<PatientPlans patientId="student-1" />);

    expect(screen.getByText("Plano de leitura")).toBeTruthy();
    expect(screen.getByText("Plano encerrado")).toBeTruthy();
    expect(screen.getByText("Sessão cancelada")).toBeTruthy();
    expect(screen.getByText(/PDI · Ativo/)).toBeTruthy();
    expect(screen.getByText(/PDI · Concluído/)).toBeTruthy();
    expect(screen.getByText(/PE · Cancelado/)).toBeTruthy();
    expect(screen.getAllByText("25%")).toHaveLength(3);
    expect(screen.getAllByText("Próxima revisão: 05/11")).toHaveLength(3);
    const cards = screen.getAllByRole("button", { name: /Abrir plano/ });
    expect(cards[0].props.accessibilityLabel).toContain("Plano de leitura");
    await fireEvent.press(cards[0]);
    expect(push).toHaveBeenCalledWith(planDetailRoute("active"));
  });

  it("leva o paciente para a geração (AC-PAC-04-02)", async () => {
    await render(<PatientPlans patientId="student-1" />);
    await fireEvent.press(
      screen.getByRole("button", { name: "Criar novo plano" }),
    );
    expect(push).toHaveBeenCalledWith({
      pathname: NEW_PLAN_ROUTE,
      params: { studentId: "student-1" },
    });
  });

  it("mostra carregamento, erro recuperável e vazio", async () => {
    plans = undefined;
    await render(<PatientPlans patientId="student-1" />);
    expect(screen.getByText("Carregando planos...")).toBeTruthy();

    failed = true;
    await render(<PatientPlans patientId="student-1" />);
    await fireEvent.press(
      screen.getByRole("button", { name: "Tentar de novo" }),
    );
    expect(refetch).toHaveBeenCalled();

    failed = false;
    plans = [];
    await render(<PatientPlans patientId="student-1" />);
    expect(screen.getByText("Nenhum plano para este paciente")).toBeTruthy();
  });

  it("mostra PDI vigente e abre detalhe; sem PDI oferece criação (AC-PAC-04-03)", async () => {
    await render(<ActivePdi patientId="student-1" />);
    expect(screen.getByText("PDI vigente")).toBeTruthy();
    expect(screen.getByText("Plano de leitura")).toBeTruthy();
    expect(screen.getByText("01/10/2026 a 01/01/2027")).toBeTruthy();
    expect(screen.getByText("25% das metas atingidas")).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Ver plano completo" }),
    );
    expect(push).toHaveBeenCalledWith(planDetailRoute("active"));

    activePlans = [];
    await render(<ActivePdi patientId="student-1" />);
    expect(screen.getByText("Nenhum PDI ativo")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Criar PDI" }));
    expect(push).toHaveBeenCalledWith({
      pathname: NEW_PLAN_ROUTE,
      params: { studentId: "student-1" },
    });
  });
});

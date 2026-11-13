import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ScaleApplicationSummary } from "@/api/types";
import { fireEvent, render, screen } from "@/test-utils/render";

const push = vi.fn();
let applications: ScaleApplicationSummary[];

vi.mock("expo-router", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));
vi.mock("@/features/assessments/hub/useAssessmentsHub", () => ({
  useRecentApplications: () => ({
    data: applications,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));
vi.mock("@/features/anamnese/responses/useAnamneseResponses", () => ({
  useAnamneseResponses: () => ({
    data: [{ id: "resp-1", answeredAt: "2026-10-05T12:00:00.000Z" }],
    isPending: false,
    isError: false,
  }),
}));

const { PatientAssessments } =
  await import("@/features/patients/detail/assessments/PatientAssessments");

function application(
  id: string,
  status: "DRAFT" | "COMPLETED",
): ScaleApplicationSummary {
  return {
    id,
    templateId: "tpl-1",
    templateCode: "SNAP",
    templateVersion: 1,
    templateName: "SNAP-IV",
    studentId: "student-1",
    studentName: "Lia",
    educatorId: "e-1",
    status,
    score: {
      partial: false,
      answered: 18,
      total: 18,
      value: 20,
      max: 54,
      band: { label: "Indicativo moderado", severity: "MODERATE" },
      subscales: [],
    },
    disclaimer: "x",
    startedAt: "2026-10-01T12:00:00.000Z",
    updatedAt: "2026-10-02T12:00:00.000Z",
  };
}

describe("PatientAssessments (PAC-05)", () => {
  beforeEach(() => {
    push.mockClear();
    applications = [
      application("a-1", "COMPLETED"),
      application("a-2", "DRAFT"),
    ];
  });

  it("AC-PAC-05-01 lista as escalas e a anamnese", async () => {
    await render(<PatientAssessments patientId="student-1" />);
    expect(await screen.findAllByText("SNAP-IV")).toHaveLength(2);
    expect(await screen.findByText("Ver resultado")).toBeTruthy();
    expect(await screen.findByText("Continuar")).toBeTruthy();
    expect(await screen.findByText("Ver síntese")).toBeTruthy();
  });

  it("AC-PAC-05-02 navega para resultado, síntese e nova avaliação", async () => {
    await render(<PatientAssessments patientId="student-1" />);
    fireEvent.press(await screen.findByText("Ver resultado"));
    expect(push).toHaveBeenLastCalledWith(
      expect.objectContaining({ pathname: "/assessments/results/[id]" }),
    );
    fireEvent.press(await screen.findByText("Ver síntese"));
    expect(push).toHaveBeenLastCalledWith(
      expect.objectContaining({ pathname: "/patients/[id]/anamnese-summary" }),
    );
    fireEvent.press(await screen.findByText("Nova avaliação"));
    expect(push).toHaveBeenLastCalledWith({
      pathname: "/assessments",
      params: { studentId: "student-1" },
    });
  });
});

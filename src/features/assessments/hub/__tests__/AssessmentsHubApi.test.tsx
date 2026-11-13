import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen, waitFor } from "@/test-utils/render";

const listScaleTemplates = vi.fn();
const listScaleApplications = vi.fn();

vi.mock("expo-router", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));
vi.mock("@/hooks/useOnline", () => ({ useOnline: () => true }));
vi.mock("@/api/endpoints/scales", () => ({
  scaleQueryKeys: {
    templates: () => ["scales", "templates"],
    applications: (filters: unknown) => ["scales", "applications", filters],
  },
  listScaleTemplates: () => listScaleTemplates(),
  listScaleApplications: (filters: unknown) => listScaleApplications(filters),
}));

const { AssessmentsHubScreen } =
  await import("@/features/assessments/hub/AssessmentsHubScreen");

describe("AssessmentsHubScreen com os endpoints (AC-AVA-01-01)", () => {
  beforeEach(() => {
    listScaleTemplates.mockReset();
    listScaleApplications.mockReset();
    listScaleTemplates.mockResolvedValue([
      {
        id: "t1",
        code: "ESC",
        version: 1,
        name: "Escala do servidor",
        description: "",
        respondent: "PROFESSIONAL",
        estimatedMinutes: 7,
        itemCount: 12,
        active: true,
      },
    ]);
    listScaleApplications.mockResolvedValue([]);
  });

  it("busca o catálogo e as aplicações recentes", async () => {
    await render(<AssessmentsHubScreen />);

    await waitFor(() =>
      expect(screen.getByText("Escala do servidor")).toBeTruthy(),
    );
    expect(screen.getByText("12 itens · 7 min")).toBeTruthy();
    expect(listScaleApplications).toHaveBeenCalledWith({ limit: 20 });
  });

  it("filtra as aplicações pelo paciente recebido", async () => {
    await render(<AssessmentsHubScreen studentId="s9" />);

    await waitFor(() =>
      expect(listScaleApplications).toHaveBeenCalledWith({
        studentId: "s9",
        limit: 20,
      }),
    );
  });
});

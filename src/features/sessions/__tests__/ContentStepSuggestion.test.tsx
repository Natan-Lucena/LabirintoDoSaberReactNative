import { describe, expect, it, vi } from "vitest";

import {
  getSessionEvolution,
  listSessionEvolutions,
} from "@/api/endpoints/evolution";
import { createQueryClient } from "@/api/query-client";
import type { SessionEvolution, SessionEvolutionSummary } from "@/api/types";
import { render, screen } from "@/test-utils/render";
import { ContentStep } from "../ContentStep";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));
vi.mock("expo-router", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/api/endpoints/content", () => ({
  listTaskNotebooks: vi.fn().mockResolvedValue([]),
  listTaskGroupsByEducator: vi.fn().mockResolvedValue([]),
  listTasks: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/api/endpoints/session", () => ({
  listSessionsByStudent: vi.fn(),
  startSession: vi.fn(),
}));
vi.mock("@/api/endpoints/evolution", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/endpoints/evolution")>()),
  listSessionEvolutions: vi.fn(),
  getSessionEvolution: vi.fn(),
}));
vi.mock("@/stores/session-flow", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/stores/session-flow")>()),
  useSessionFlowStore: () => ({
    configure: vi.fn(),
    requestStart: vi.fn(),
    confirmStart: vi.fn(),
    markStartUncertain: vi.fn(),
    failStart: vi.fn(),
    discard: vi.fn(),
    selectStudent: vi.fn(),
    setAppointmentId: vi.fn(),
    cancel: vi.fn(),
    step: "configured",
    appointmentId: null,
    student: { id: "student-1", name: "Ana Souza" },
    sessionName: null,
    content: null,
  }),
}));

function summary(id: string): SessionEvolutionSummary {
  return {
    id,
    sessionId: `s-${id}`,
    studentId: "student-1",
    studentName: "Ana Souza",
    sessionDate: "2026-10-27",
    criteriaCount: 0,
    achievedCount: 0,
    excerpt: "",
    createdAt: "2026-10-27T14:00:00.000Z",
  };
}

function detail(id: string, suggestion?: string): SessionEvolution {
  return {
    id,
    sessionId: `s-${id}`,
    studentId: "student-1",
    educatorId: "e1",
    sessionDate: "2026-10-27",
    criteria: [],
    descriptiveRecord: "Registro.",
    goalUpdates: [],
    createdAt: "2026-10-27T14:00:00.000Z",
    updatedAt: "2026-10-27T14:00:00.000Z",
    ...(suggestion ? { nextSessionSuggestion: suggestion } : {}),
  };
}

function renderStep() {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false } });
  return render(<ContentStep />, { queryClient });
}

describe("ContentStep — sugestão da última evolução (AC-EVO-04-03)", () => {
  it("mostra a sugestão da evolução mais recente que tem uma", async () => {
    vi.mocked(listSessionEvolutions).mockResolvedValue([
      summary("e2"),
      summary("e1"),
    ]);
    vi.mocked(getSessionEvolution).mockImplementation(async (id) =>
      id === "e1" ? detail(id, "Retomar a contagem.") : detail(id),
    );
    await renderStep();

    expect(await screen.findByText("Retomar a contagem.")).toBeTruthy();
    expect(screen.getByText("Sugestão da última evolução")).toBeTruthy();
  });

  it("fica oculto quando nenhuma evolução tem sugestão", async () => {
    vi.mocked(listSessionEvolutions).mockResolvedValue([summary("e1")]);
    vi.mocked(getSessionEvolution).mockResolvedValue(detail("e1"));
    await renderStep();

    await screen.findByText("Paciente: Ana Souza");
    await vi.waitFor(() => expect(getSessionEvolution).toHaveBeenCalled());
    expect(screen.queryByText("Sugestão da última evolução")).toBeNull();
  });
});

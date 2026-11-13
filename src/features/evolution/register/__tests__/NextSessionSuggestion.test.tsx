import { act, fireEvent, screen } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createSessionEvolution,
  generateNextSessionSuggestion,
  getEvolutionContext,
} from "@/api/endpoints/evolution";
import { ApiError } from "@/api/errors";
import type { EvolutionContext, SessionEvolution } from "@/api/types";
import { render } from "@/test-utils/render";
import { EvolutionScreen } from "../EvolutionScreen";

const router = {
  replace: vi.fn(),
  push: vi.fn(),
  back: vi.fn(),
  canGoBack: vi.fn(() => true),
};
vi.mock("expo-router", () => ({
  useRouter: () => router,
  useNavigation: () => ({
    addListener: () => () => undefined,
    dispatch: vi.fn(),
  }),
  useFocusEffect: vi.fn(),
}));
vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));
vi.mock("@/storage/mmkv", () => ({
  getActiveEducatorId: vi.fn(() => "educator-1"),
  getStorage: vi.fn(),
  clearSessionFlow: vi.fn(),
}));
vi.mock("@/api/endpoints/evolution", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/endpoints/evolution")>()),
  getEvolutionContext: vi.fn(),
  createSessionEvolution: vi.fn(),
  generateNextSessionSuggestion: vi.fn(),
}));

const SESSION_ID = "session-1";
const SUGGESTION_LABEL = "Texto da sugestão para a próxima sessão";
const CONTEXT: EvolutionContext = {
  session: {
    id: SESSION_ID,
    studentId: "student-1",
    studentName: "Paciente Fictício",
    name: "Contagem",
    startedAt: "2026-10-27T13:00:00.000Z",
    finishedAt: "2026-10-27T13:50:00.000Z",
    durationMinutes: 50,
    answeredCount: 3,
    correctCount: 2,
  },
  suggestedCriteria: [],
};
const SAVED: SessionEvolution = {
  id: "evolution-1",
  sessionId: SESSION_ID,
  studentId: "student-1",
  educatorId: "educator-1",
  sessionDate: "2026-10-27",
  criteria: [],
  descriptiveRecord: "Registro.",
  goalUpdates: [],
  createdAt: "2026-10-27T14:00:00.000Z",
  updatedAt: "2026-10-27T14:00:00.000Z",
};

async function press(name: string) {
  await act(async () => fireEvent.press(screen.getByRole("button", { name })));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getEvolutionContext).mockResolvedValue(CONTEXT);
  vi.mocked(createSessionEvolution).mockResolvedValue(SAVED);
});

describe("EvolutionScreen — sugestão da IA (EVO-04)", () => {
  async function renderLoaded() {
    await render(<EvolutionScreen sessionId={SESSION_ID} />);
    await screen.findByLabelText(SUGGESTION_LABEL);
  }

  it("AC-EVO-04-01: mostra o erro, não reenvia sozinha e 'Tentar novamente' chama de novo", async () => {
    vi.mocked(generateNextSessionSuggestion)
      .mockRejectedValueOnce(
        new ApiError({ message: "AI_GENERATION_FAILED", status: 500 }),
      )
      .mockResolvedValueOnce({ suggestion: "Retomar a contagem." });
    await renderLoaded();

    await press("Gerar sugestão");
    expect(
      await screen.findByText(
        "Não foi possível gerar a sugestão. Tente novamente.",
      ),
    ).toBeTruthy();
    expect(generateNextSessionSuggestion).toHaveBeenCalledTimes(1);

    await press("Tentar novamente");
    expect(generateNextSessionSuggestion).toHaveBeenCalledTimes(2);
    expect(await screen.findByDisplayValue("Retomar a contagem.")).toBeTruthy();
  });

  it("AC-EVO-04-02: o texto editado é o que vai em nextSessionSuggestion", async () => {
    vi.mocked(generateNextSessionSuggestion).mockResolvedValue({
      suggestion: "Texto da IA.",
    });
    await renderLoaded();

    await press("Gerar sugestão");
    await screen.findByDisplayValue("Texto da IA.");
    await act(async () =>
      fireEvent.changeText(
        screen.getByLabelText(SUGGESTION_LABEL),
        "Texto editado.",
      ),
    );
    await act(async () =>
      fireEvent.changeText(
        screen.getByLabelText("Registro descritivo"),
        "Registro.",
      ),
    );
    await press("Salvar e atualizar prontuário");

    expect(vi.mocked(createSessionEvolution).mock.calls[0]?.[0]).toMatchObject({
      nextSessionSuggestion: "Texto editado.",
    });
  });
});

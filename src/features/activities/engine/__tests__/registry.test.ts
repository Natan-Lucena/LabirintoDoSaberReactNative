import { describe, expect, it, vi } from "vitest";

import { QuizActivity } from "../QuizActivity";
import { getActivityComponent, isActivityTypePlayable } from "../registry";

vi.mock("@/components/media/AudioPlayer", () => ({ AudioPlayer: () => null }));

describe("registro de tipos de atividade", () => {
  it("AC-ATV-03-01: mapeia os tipos de múltipla escolha para o quiz", () => {
    expect(getActivityComponent("multipleChoice")).toBe(QuizActivity);
    expect(getActivityComponent("multipleChoiceWithMedia")).toBe(QuizActivity);
    expect(isActivityTypePlayable("multipleChoice")).toBe(true);
  });

  it("AC-ATV-03-01: tipo desconhecido não tem componente", () => {
    expect(getActivityComponent("memoriaVisual")).toBeNull();
    expect(isActivityTypePlayable("memoriaVisual")).toBe(false);
  });
});

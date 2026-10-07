import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { createTask } from "@/api/endpoints/task-create";
import { mockAdapter } from "@/mocks/adapter";
import { MOCK_TASKS } from "@/mocks/handlers/content";
import "@/mocks/handlers/task-create";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("createTask com mockAdapter", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("cria uma atividade a partir do formData e devolve 201 vazio", async () => {
    const countBeforeCreate = MOCK_TASKS.length;

    await expect(
      createTask({
        category: "reading",
        prompt: "Qual é a capital do Brasil?",
        alternatives: [
          { text: "Brasília", isCorrect: true },
          { text: "Rio de Janeiro", isCorrect: false },
        ],
      }),
    ).resolves.toBeUndefined();

    expect(MOCK_TASKS).toHaveLength(countBeforeCreate + 1);
    expect(MOCK_TASKS.at(-1)).toMatchObject({
      category: "reading",
      type: "multipleChoice",
      prompt: "Qual é a capital do Brasil?",
      alternatives: [
        { text: "Brasília", isCorrect: true },
        { text: "Rio de Janeiro", isCorrect: false },
      ],
    });
  });

  it("cria uma atividade com imagem e áudio como multipleChoiceWithMedia", async () => {
    const countBeforeCreate = MOCK_TASKS.length;

    await expect(
      createTask({
        category: "reading",
        prompt: "Qual animal aparece na imagem?",
        alternatives: [
          { text: "Gato", isCorrect: true },
          { text: "Cachorro", isCorrect: false },
        ],
        imageFile: {
          uri: "file:///gato.jpg",
          name: "gato.jpg",
          mimeType: "image/jpeg",
        },
        audioFile: {
          uri: "file:///instrucao.mp3",
          name: "instrucao.mp3",
          mimeType: "audio/mpeg",
        },
      }),
    ).resolves.toBeUndefined();

    expect(MOCK_TASKS).toHaveLength(countBeforeCreate + 1);
    expect(MOCK_TASKS.at(-1)).toMatchObject({
      type: "multipleChoiceWithMedia",
      imageFile: "mock://task-media/image",
      audioFile: "mock://task-media/audio",
    });
  });

  it("rejeita menos de 2 alternativas com 400 INVALID_ALTERNATIVES_FORMAT", async () => {
    await expect(
      createTask({
        category: "reading",
        prompt: "Enunciado",
        alternatives: [{ text: "Única", isCorrect: true }],
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "INVALID_ALTERNATIVES_FORMAT",
    });
  });

  it("rejeita quando nenhuma alternativa é marcada como correta com 500", async () => {
    await expect(
      createTask({
        category: "reading",
        prompt: "Enunciado",
        alternatives: [
          { text: "A", isCorrect: false },
          { text: "B", isCorrect: false },
        ],
      }),
    ).rejects.toMatchObject({
      status: 500,
      code: "AT_LEAST_ONE_ALTERNATIVE_MUST_BE_CORRECT",
    });
  });
});

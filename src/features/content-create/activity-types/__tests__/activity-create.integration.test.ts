import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { getTaskById } from "@/api/endpoints/content";
import { createActivity } from "@/api/endpoints/task-create";
import { updateTask } from "@/api/endpoints/task-update";
import { normalizeApiError } from "@/api/errors";
import { mockAdapter } from "@/mocks/adapter";
import { MOCK_TASKS } from "@/mocks/handlers/content";
import "@/mocks/handlers/task-create";
import "@/mocks/handlers/task-delete";
import "@/mocks/handlers/task-update";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

const wordContent = {
  kind: "wordBuilder" as const,
  word: "GATO",
  distractors: ["E", "I"],
};

describe("createActivity / updateTask com mockAdapter (ATV-11)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("cria um tipo novo e devolve a Task (201), visível em GET /task/:id", async () => {
    const created = await createActivity({
      category: "writing",
      type: "wordBuilder",
      prompt: "Forme a palavra da figura",
      content: wordContent,
      skills: ["LETTER_RECOGNITION"],
      theme: "Animais",
      tone: "peach",
    });

    expect(created).toMatchObject({
      type: "wordBuilder",
      format: "INTERACTIVE",
      source: "EDUCATOR",
      skills: ["LETTER_RECOGNITION"],
      tone: "peach",
      content: wordContent,
    });
    expect(MOCK_TASKS.at(-1)?.id).toBe(created?.id);
    await expect(getTaskById(created!.id)).resolves.toMatchObject({
      content: wordContent,
    });
  });

  it("INVALID_CONTENT traz o field com o caminho completo", async () => {
    const error = await createActivity({
      category: "vocabulary",
      type: "colorMatch",
      prompt: "Ligue as cores",
      content: {
        kind: "colorMatch",
        pairs: [
          { id: "p1", word: "Sol", colorHex: "#FACC15" },
          { id: "p2", word: "", colorHex: "#2563EB" },
        ],
      },
    }).catch(normalizeApiError);

    expect(error).toMatchObject({
      status: 400,
      code: "INVALID_CONTENT",
      errors: [{ path: "content.pairs.1.word" }],
    });
  });

  it("recusa habilidade fora do catálogo (INVALID_SKILL)", async () => {
    const error = await createActivity({
      category: "writing",
      type: "wordBuilder",
      prompt: "x",
      content: wordContent,
      skills: ["NOPE"],
    }).catch(normalizeApiError);
    expect(error).toMatchObject({ code: "INVALID_SKILL" });
  });

  it("edita o conteúdo de um tipo novo e recusa trocar o tipo", async () => {
    const created = await createActivity({
      category: "writing",
      type: "wordBuilder",
      prompt: "Forme a palavra",
      content: wordContent,
    });
    const id = created!.id;

    await updateTask({
      id,
      content: { ...wordContent, word: "GATA" },
      theme: "Casa",
    });
    await expect(getTaskById(id)).resolves.toMatchObject({
      theme: "Casa",
      content: { word: "GATA" },
    });

    const typeError = await updateTask({ id, type: "multipleChoice" }).catch(
      normalizeApiError,
    );
    expect(typeError).toMatchObject({ code: "TYPE_CHANGE_NOT_ALLOWED" });
  });

  it("atividade da biblioteca é somente leitura (LIBRARY_TASK_READ_ONLY)", async () => {
    const error = await updateTask({
      id: "lib-word-bola",
      prompt: "Outro",
    }).catch(normalizeApiError);
    expect(error).toMatchObject({
      status: 403,
      code: "LIBRARY_TASK_READ_ONLY",
    });
  });

  it("M-01: DELETE e GET de tarefa inexistente respondem 404", async () => {
    await expect(
      apiClient.delete("/task/delete/nao-existe"),
    ).rejects.toMatchObject({ status: 404 });
    await expect(apiClient.get("/task/nao-existe")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("M-02: POST /task/create responde 201 com a Task e 400 sem alternativa correta", async () => {
    const build = (prompt: string, correct: boolean) => {
      const form = new FormData();
      form.append("category", "reading");
      form.append("type", "multipleChoice");
      form.append("prompt", prompt);
      form.append(
        "alternatives",
        JSON.stringify([
          { text: "A", isCorrect: correct },
          { text: "B", isCorrect: false },
        ]),
      );
      return form;
    };
    const created = await apiClient.post(
      "/task/create",
      build("Enunciado", true),
    );
    expect(created.status).toBe(201);
    expect(created.data).toMatchObject({ prompt: "Enunciado" });
    await expect(
      apiClient.post("/task/create", build("Sem correta", false)),
    ).rejects.toMatchObject({ status: 400 });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { updateTask } from "@/api/endpoints/task-update";
import { mockAdapter } from "@/mocks/adapter";
import { MOCK_TASKS } from "@/mocks/handlers/content";
import "@/mocks/handlers/task-update";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("updateTask com mockAdapter", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("atualiza somente os campos recebidos pelo PUT /task/update", async () => {
    const task = MOCK_TASKS.find((item) => item.id === "task-1");
    expect(task).toBeDefined();
    const categoryBeforeUpdate = task?.category;

    await expect(
      updateTask({ id: "task-1", prompt: "Novo enunciado" }),
    ).resolves.toBeUndefined();

    expect(task).toMatchObject({
      id: "task-1",
      prompt: "Novo enunciado",
      category: categoryBeforeUpdate,
    });
  });

  it("atualiza imagem e áudio recebendo URLs já enviadas por /task/upload-media", async () => {
    const task = MOCK_TASKS.find((item) => item.id === "task-2");
    expect(task).toBeDefined();

    await expect(
      updateTask({
        id: "task-2",
        type: "multipleChoiceWithMedia",
        imageFile: "https://bucket.s3.amazonaws.com/image.jpg",
        audioFile: "https://bucket.s3.amazonaws.com/audio.mp3",
      }),
    ).resolves.toBeUndefined();

    expect(task).toMatchObject({
      type: "multipleChoiceWithMedia",
      imageFile: "https://bucket.s3.amazonaws.com/image.jpg",
      audioFile: "https://bucket.s3.amazonaws.com/audio.mp3",
    });
  });

  it("rejeita com 500 TASK_NOT_FOUND quando o id não existe", async () => {
    await expect(
      updateTask({ id: "task-inexistente", prompt: "Novo enunciado" }),
    ).rejects.toMatchObject({
      status: 500,
      code: "TASK_NOT_FOUND",
    });
  });
});

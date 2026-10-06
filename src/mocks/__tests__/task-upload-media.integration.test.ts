import { apiClient } from "@/api/client";
import { uploadTaskMedia } from "@/api/endpoints/task-upload-media";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/handlers/task-upload-media";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("POST /task/upload-media mockado", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("envia FormData ao handler e devolve a URL de mídia", async () => {
    await expect(
      uploadTaskMedia({
        uri: "file:///imagem.png",
        name: "imagem.png",
        mimeType: "image/png",
        size: 512,
      }),
    ).resolves.toMatch(/^https:\/\/mock\.local\/media\/mock-media-\d+\.bin$/);
  });
});

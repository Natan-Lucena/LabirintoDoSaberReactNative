import { apiClient } from "@/api/client";
import {
  TaskMediaTooLargeError,
  uploadTaskMedia,
} from "@/api/endpoints/task-upload-media";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

describe("uploadTaskMedia", () => {
  it("recusa arquivo acima de 10 MB antes de enviar", async () => {
    const post = vi.spyOn(apiClient, "post");

    await expect(
      uploadTaskMedia({
        uri: "file:///audio.mp3",
        name: "audio.mp3",
        mimeType: "audio/mpeg",
        size: 10 * 1024 * 1024 + 1,
      }),
    ).rejects.toBeInstanceOf(TaskMediaTooLargeError);

    expect(post).not.toHaveBeenCalled();
    post.mockRestore();
  });
});

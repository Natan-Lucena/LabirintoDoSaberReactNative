import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/api/client";
import { getMe } from "@/api/endpoints/educator";
import {
  updateEducator,
  updateProfilePicture,
} from "@/api/endpoints/educator-update";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/handlers/educator";
import "@/mocks/handlers/educator-update";
import { setMockSession } from "@/mocks/mock-auth-state";
import { MOCK_TOKEN } from "@/mocks/fixtures";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

describe("educator update through apiClient", () => {
  const previousAdapter = apiClient.defaults.adapter;
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    setMockSession(MOCK_TOKEN);
  });
  afterEach(() => {
    apiClient.defaults.adapter = previousAdapter;
  });

  it("discards the prefixed response including _password and reads /me", async () => {
    const result = await updateEducator({ newName: "Aline Nova" });
    expect(result).toBeUndefined();
    expect((await getMe()).name).toBe("Aline Nova");
  });

  it("uploads multipart photo and rejects a file over 5 MB", async () => {
    const file = {
      uri: "file:///photo.jpg",
      name: "photo.jpg",
      mimeType: "image/jpeg",
      size: 100,
    };
    expect(await updateProfilePicture(file)).toBeUndefined();
    expect((await getMe()).photoUrl).toContain("photo.jpg");
    const put = vi.spyOn(apiClient, "put");
    await expect(
      updateProfilePicture({ ...file, size: 5 * 1024 * 1024 + 1 }),
    ).rejects.toThrow("5 MB");
    expect(put).not.toHaveBeenCalled();
    put.mockRestore();
  });
});

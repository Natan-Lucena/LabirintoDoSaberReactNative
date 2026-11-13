import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { AI_TIMEOUT_MS } from "@/api/endpoints/ai-timeout";
import { generateAnamneseSummary } from "@/api/endpoints/anamnese-responses";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

describe("generateAnamneseSummary (PAC-09)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("faz POST em /summary com timeout de 90 s e devolve a resposta", async () => {
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue({ data: { id: "r-1" } });

    await expect(generateAnamneseSummary("r-1")).resolves.toEqual({
      id: "r-1",
    });
    expect(post).toHaveBeenCalledWith(
      "/anamnese/responses/r-1/summary",
      undefined,
      { timeout: AI_TIMEOUT_MS },
    );
  });
});

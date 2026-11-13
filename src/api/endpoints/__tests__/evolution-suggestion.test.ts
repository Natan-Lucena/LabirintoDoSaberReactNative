import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { AI_TIMEOUT_MS } from "@/api/endpoints/ai-timeout";
import { generateNextSessionSuggestion } from "@/api/endpoints/evolution";

describe("generateNextSessionSuggestion (EVO-04)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("faz POST na rota de IA com timeout de 90 s e devolve o corpo", async () => {
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue({ data: { suggestion: "Retomar." } });

    const result = await generateNextSessionSuggestion({ sessionId: "s1" });

    expect(post).toHaveBeenCalledWith(
      "/session-evolution/next-session-suggestion",
      { sessionId: "s1" },
      { timeout: AI_TIMEOUT_MS },
    );
    expect(result).toEqual({ suggestion: "Retomar." });
  });
});

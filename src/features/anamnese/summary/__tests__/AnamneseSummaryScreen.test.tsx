import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AnamneseResponse } from "@/api/endpoints/anamnese-responses";
import { render, screen } from "@/test-utils/render";

let response: Partial<AnamneseResponse>;

vi.mock("expo-router", () => ({ useRouter: () => ({ back: vi.fn() }) }));
vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));
vi.mock("@/features/anamnese/responses/useAnamneseResponses", async (orig) => ({
  ...(await orig<
    typeof import("@/features/anamnese/responses/useAnamneseResponses")
  >()),
  useAnamneseResponses: () => ({
    data: [response],
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

const { AnamneseSummaryScreen } =
  await import("@/features/anamnese/summary/AnamneseSummaryScreen");

describe("AnamneseSummaryScreen (PAC-09)", () => {
  beforeEach(() => {
    response = { id: "r-1", answeredAt: "2026-10-05T12:00:00.000Z" };
  });

  it("AC-PAC-09-01 sem síntese mostra Gerar síntese; com síntese, texto e data", async () => {
    const { unmount } = await render(<AnamneseSummaryScreen patientId="s-1" />);
    expect(await screen.findByText("Gerar síntese")).toBeTruthy();
    await unmount();

    response = {
      ...response,
      summary: {
        text: "- Histórico resumido",
        generatedAt: "2026-10-06T12:00:00.000Z",
      },
    };
    await render(<AnamneseSummaryScreen patientId="s-1" />);
    expect(await screen.findByText("• Histórico resumido")).toBeTruthy();
    expect(await screen.findByText(/Gerada em/)).toBeTruthy();
    expect(await screen.findByText("Gerar de novo")).toBeTruthy();
  });

  it("AC-PAC-09-02 summaryOutdated mostra o aviso", async () => {
    response = {
      ...response,
      summary: { text: "x", generatedAt: "2026-10-06T12:00:00.000Z" },
      summaryOutdated: true,
    };
    await render(<AnamneseSummaryScreen patientId="s-1" />);
    expect(
      await screen.findByText("A anamnese mudou depois desta síntese"),
    ).toBeTruthy();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/handlers/student";
import {
  MOCK_SCALE_APPLICATION_COMPLETED_ID,
  resetMockScaleState,
} from "@/mocks/handlers/scales";
import { fireEvent, render, screen } from "@/test-utils/render";

vi.mock("expo-router", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));
vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const { ScaleResultScreen } = await import("../ScaleResultScreen");

describe("ScaleResultScreen (AVA-04)", () => {
  beforeEach(() => {
    resetMockScaleState();
    apiClient.defaults.adapter = mockAdapter;
  });

  it("mostra escore, faixa, aviso e as respostas item a item (AC-AVA-04-01)", async () => {
    await render(
      <ScaleResultScreen applicationId={MOCK_SCALE_APPLICATION_COMPLETED_ID} />,
    );

    expect(await screen.findByText(/Escore total:/)).toBeTruthy();

    await fireEvent.press(
      screen.getByRole("button", { name: /Ver respostas/ }),
    );

    expect(await screen.findByText(/^1\. /)).toBeTruthy();
  });
});

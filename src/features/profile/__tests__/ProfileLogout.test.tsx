import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { View } from "react-native";
import { fireEvent, render, waitFor } from "@/test-utils/render";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));
vi.mock("@/features/home/useHomeData", () => ({
  homeQueryKeys: { educator: ["educator", "me"] },
}));
const logout = vi.fn().mockResolvedValue(undefined);
vi.mock("expo-router", () => ({ useRouter: () => ({ back: vi.fn() }) }));
vi.mock("@/api/endpoints/educator", () => ({
  getMe: () =>
    Promise.resolve({
      id: "edu-1",
      name: "Aline Martins",
      email: "aline@example.test",
    }),
}));
vi.mock("@/api/endpoints/educator-update", () => ({
  updateEducator: vi.fn(),
  updateProfilePicture: vi.fn(),
}));
vi.mock("@/stores/auth", () => ({
  useAuthStore: { getState: () => ({ logout }) },
}));
vi.mock("@/components/media/ImagePickerField", () => ({
  ImagePickerField: () => <View />,
}));

const { ProfileScreen } = await import("@/features/profile/ProfileScreen");

describe("Profile logout (AC-REC-02-04..05)", () => {
  it("waits for confirmation and clears query cache", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(["other"], "secret");
    const view = await render(<ProfileScreen />, { queryClient });
    await waitFor(() =>
      expect(view.getByRole("button", { name: "Sair" })).toBeTruthy(),
    );
    await fireEvent.press(view.getByRole("button", { name: "Sair" }));
    expect(logout).not.toHaveBeenCalled();
    await fireEvent.press(
      view.getByRole("button", { name: "Confirmar saída" }),
    );
    await waitFor(() => expect(logout).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0),
    );
  });
});

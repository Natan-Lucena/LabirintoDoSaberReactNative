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
const push = vi.fn();
vi.mock("expo-router", () => ({
  useRouter: () => ({ back: vi.fn(), push }),
}));
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
  useAuthStore: { getState: () => ({ logout: vi.fn() }) },
}));
vi.mock("@/components/media/ImagePickerField", () => ({
  ImagePickerField: () => <View />,
}));

const { ProfileScreen } = await import("@/features/profile/ProfileScreen");

describe("Profile: entrada de troca de senha (REC-03)", () => {
  it("'Trocar senha' abre a tela de troca de senha", async () => {
    const view = await render(<ProfileScreen />, {
      queryClient: new QueryClient(),
    });
    await waitFor(() =>
      expect(view.getByRole("button", { name: "Trocar senha" })).toBeTruthy(),
    );
    await fireEvent.press(view.getByRole("button", { name: "Trocar senha" }));
    expect(push).toHaveBeenCalledWith("/profile/change-password");
  });
});

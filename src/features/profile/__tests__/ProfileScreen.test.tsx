import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { Pressable, Text } from "react-native";
import { fireEvent, render, waitFor } from "@/test-utils/render";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));
vi.mock("@/features/home/useHomeData", () => ({
  homeQueryKeys: { educator: ["educator", "me"] },
}));
const update = vi.fn().mockResolvedValue(undefined);
const upload = vi.fn().mockResolvedValue(undefined);
const logout = vi.fn().mockResolvedValue(undefined);
const getMe = vi.fn();
vi.mock("expo-router", () => ({ useRouter: () => ({ back: vi.fn() }) }));
vi.mock("@/api/endpoints/educator", () => ({ getMe: () => getMe() }));
vi.mock("@/api/endpoints/educator-update", () => ({
  updateEducator: (value: unknown) => update(value),
  updateProfilePicture: (value: unknown) => upload(value),
}));
vi.mock("@/stores/auth", () => ({
  useAuthStore: { getState: () => ({ logout }) },
}));
vi.mock("@/components/media/ImagePickerField", () => ({
  ImagePickerField: ({ onChange }: { onChange: (value: unknown) => void }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Escolher foto"
      onPress={() =>
        onChange({
          uri: "file:///photo.jpg",
          name: "photo.jpg",
          mimeType: "image/jpeg",
          size: 100,
        })
      }
    >
      <Text>Escolher foto</Text>
    </Pressable>
  ),
}));

const { ProfileScreen } = await import("@/features/profile/ProfileScreen");
const educator = {
  id: "edu-1",
  name: "Aline Martins",
  email: "aline@example.test",
  contact: null,
  profession: null,
  photoUrl: null,
};

describe("ProfileScreen (REC-02)", () => {
  it("valida, salva só o alterado, recarrega /me e envia foto", async () => {
    getMe.mockResolvedValue(educator);
    upload.mockImplementation(async () => {
      getMe.mockResolvedValue({
        ...educator,
        photoUrl: "https://example.test/photo.jpg",
      });
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(["other"], "secret");
    const view = await render(<ProfileScreen />, { queryClient });
    await waitFor(() =>
      expect(view.getByDisplayValue("Aline Martins")).toBeTruthy(),
    );
    fireEvent.changeText(view.getByLabelText("Nome"), "Al");
    await fireEvent.press(view.getByRole("button", { name: "Salvar" }));
    expect(update).not.toHaveBeenCalled();
    fireEvent.changeText(view.getByLabelText("Nome"), "Aline Nova");
    await fireEvent.press(view.getByRole("button", { name: "Salvar" }));
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({ newName: "Aline Nova" }),
    );
    await waitFor(() => expect(getMe.mock.calls.length).toBeGreaterThan(1));
    await fireEvent.press(view.getByRole("button", { name: "Escolher foto" }));
    await waitFor(() =>
      expect(upload).toHaveBeenCalledWith({
        uri: "file:///photo.jpg",
        name: "photo.jpg",
        mimeType: "image/jpeg",
        size: 100,
      }),
    );
    await waitFor(() =>
      expect(
        queryClient.getQueryData<{ photoUrl: string }>(["educator", "me"])
          ?.photoUrl,
      ).toBe("https://example.test/photo.jpg"),
    );
  });
});

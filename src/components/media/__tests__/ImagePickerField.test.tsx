import * as ImagePicker from "expo-image-picker";
import { Linking } from "react-native";

import { fireEvent, render, screen } from "@/test-utils/render";
import { ImagePickerField } from "../ImagePickerField";
import { describe, expect, it, vi } from "vitest";

vi.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: vi.fn(),
  requestMediaLibraryPermissionsAsync: vi.fn(),
  launchCameraAsync: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
  MediaTypeOptions: { Images: "Images" },
}));

describe("ImagePickerField", () => {
  it("explica a permissão negada e abre as configurações", async () => {
    vi.mocked(
      ImagePicker.requestMediaLibraryPermissionsAsync,
    ).mockResolvedValue({
      granted: false,
      canAskAgain: false,
      expires: "never",
      status: "denied",
    } as never);
    const openSettings = vi.spyOn(Linking, "openSettings").mockResolvedValue();

    await render(<ImagePickerField value={null} onChange={vi.fn()} />);
    await fireEvent.press(screen.getByLabelText("Escolher imagem da galeria"));

    expect(
      screen.getByText(
        "Permita o acesso às fotos nas configurações para escolher uma imagem.",
      ),
    ).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Abrir configurações" }),
    );
    expect(openSettings).toHaveBeenCalledOnce();
    openSettings.mockRestore();
  });

  it("limpa o valor ao remover a imagem", async () => {
    const onChange = vi.fn();
    await render(
      <ImagePickerField
        value={{
          uri: "file:///imagem.jpg",
          name: "imagem.jpg",
          mimeType: "image/jpeg",
        }}
        onChange={onChange}
      />,
    );

    await fireEvent.press(
      screen.getByRole("button", { name: "Remover imagem" }),
    );
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

import * as DocumentPicker from "expo-document-picker";

import { fireEvent, render, screen } from "@/test-utils/render";
import { AudioPickerField } from "../AudioPickerField";
import { describe, expect, it, vi } from "vitest";

vi.mock("expo-document-picker", () => ({
  getDocumentAsync: vi.fn(),
}));

describe("AudioPickerField", () => {
  it("seleciona um arquivo de áudio e devolve seus dados", async () => {
    vi.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///audio.mp3",
          name: "audio.mp3",
          mimeType: "audio/mpeg",
          size: 1024,
        },
      ],
    } as never);
    const onChange = vi.fn();

    await render(<AudioPickerField value={null} onChange={onChange} />);
    await fireEvent.press(screen.getByLabelText("Escolher arquivo de áudio"));

    expect(onChange).toHaveBeenCalledWith({
      uri: "file:///audio.mp3",
      name: "audio.mp3",
      mimeType: "audio/mpeg",
      size: 1024,
    });
  });

  it("limpa o valor ao remover o áudio", async () => {
    const onChange = vi.fn();
    await render(
      <AudioPickerField
        value={{
          uri: "file:///audio.mp3",
          name: "audio.mp3",
          mimeType: "audio/mpeg",
        }}
        onChange={onChange}
      />,
    );

    await fireEvent.press(
      screen.getByRole("button", { name: "Remover áudio" }),
    );
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

import * as ExpoAudio from "expo-audio";

import { fireEvent, render, screen } from "@/test-utils/render";
import { AudioPlayer } from "../AudioPlayer";
import { describe, expect, it, vi } from "vitest";

const player = { pause: vi.fn(), play: vi.fn() };

vi.mock("expo-audio", () => ({
  useAudioPlayer: vi.fn(() => player),
  useAudioPlayerStatus: vi.fn(() => ({ playing: false })),
}));

describe("AudioPlayer", () => {
  it("alterna o rótulo acessível entre tocar e pausar", async () => {
    vi.mocked(ExpoAudio.useAudioPlayerStatus).mockReturnValue({
      playing: false,
    } as never);
    const view = await render(
      <AudioPlayer url="https://mock.local/audio.mp3" />,
    );

    await fireEvent.press(screen.getByRole("button", { name: "Tocar áudio" }));
    expect(player.play).toHaveBeenCalledOnce();

    vi.mocked(ExpoAudio.useAudioPlayerStatus).mockReturnValue({
      playing: true,
    } as never);
    await view.rerender(<AudioPlayer url="https://mock.local/audio.mp3" />);
    expect(screen.getByRole("button", { name: "Pausar áudio" })).toBeTruthy();
  });
});

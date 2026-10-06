import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Pressable, StyleSheet, Text } from "react-native";

import { color, shape, typography } from "@/theme";

export interface AudioPlayerProps {
  url: string;
}

export function AudioPlayer({ url }: AudioPlayerProps) {
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  const isPlaying = status.playing;

  function togglePlayback() {
    if (isPlaying) {
      player.pause();
      return;
    }
    player.play();
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isPlaying ? "Pausar áudio" : "Tocar áudio"}
      onPress={togglePlayback}
      style={styles.button}
    >
      <Text style={styles.label}>
        {isPlaying ? "Pausar áudio" : "Tocar áudio"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: shape.minTouchTarget,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: shape.buttonRadius,
    backgroundColor: color.primary,
    paddingHorizontal: 14,
  },
  label: { color: color.surface, fontFamily: typography.button.fontFamily },
});

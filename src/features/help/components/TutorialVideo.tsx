import { useEffect, useState, type ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

import { color, fontFamilies, shape } from "@/theme";

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  video: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: shape.radius.md,
    backgroundColor: color.ink[950],
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[950],
  },
});

export function TutorialVideo({
  url,
  title,
}: {
  url: string;
  title: string;
}): ReactElement {
  const player = useVideoPlayer(url);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const subscription = player.addListener("statusChange", ({ status }) => {
      setFailed(status === "error");
    });
    return () => subscription.remove();
  }, [player]);

  return (
    <View style={styles.wrap}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls
        fullscreenOptions={{ enable: true }}
        accessibilityLabel={`Vídeo: ${title}`}
      />
      {failed ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          Não foi possível tocar o vídeo agora.
        </Text>
      ) : null}
    </View>
  );
}

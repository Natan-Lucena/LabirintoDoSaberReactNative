import type { ReactElement } from "react";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { AudioPlayer } from "@/components/media/AudioPlayer";
import { color, fontFamilies, shape } from "@/theme";

export interface GameHintProps {
  prompt: string;
  imageUrl?: string;
  audioUrl?: string;
}

/** Imagem de dica, áudio e instrução, comuns aos jogos do motor. */
export function GameHint({
  prompt,
  imageUrl,
  audioUrl,
}: GameHintProps): ReactElement {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <View style={styles.container}>
      {imageUrl && !imageFailed ? (
        <Image
          source={{ uri: imageUrl }}
          accessibilityLabel="Imagem da atividade"
          resizeMode="contain"
          onError={() => setImageFailed(true)}
          style={styles.illustration}
        />
      ) : null}
      {audioUrl ? <AudioPlayer url={audioUrl} /> : null}
      <Text style={styles.prompt} accessibilityRole="header">
        {prompt}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 20 },
  illustration: { width: "100%", height: 180, borderRadius: shape.radius.lg },
  prompt: {
    color: color.ink[950],
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    fontSize: 24,
    lineHeight: 32,
    textAlign: "center",
  },
});

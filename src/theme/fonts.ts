// Carregamento de fontes da T-201 (Nunito, Roboto, Roboto Mono via
// @expo-google-fonts). Não é ligado ao root nesta tarefa (T-502 decide onde
// montar `useAppFonts` e como segurar o splash).
import { useFonts } from "expo-font";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";
import {
  Roboto_400Regular,
  Roboto_600SemiBold,
} from "@expo-google-fonts/roboto";
import {
  RobotoMono_400Regular,
  RobotoMono_700Bold,
} from "@expo-google-fonts/roboto-mono";

export interface FontFamilySet {
  regular: string;
  semiBold?: string;
  bold?: string;
}

/** Identificadores exportados pelos pacotes `@expo-google-fonts/*`. */
export const fontFamilies: {
  nunito: FontFamilySet;
  roboto: FontFamilySet;
  robotoMono: FontFamilySet;
} = {
  nunito: {
    regular: "Nunito_400Regular",
    semiBold: "Nunito_600SemiBold",
    bold: "Nunito_700Bold",
  },
  roboto: { regular: "Roboto_400Regular", semiBold: "Roboto_600SemiBold" },
  robotoMono: { regular: "RobotoMono_400Regular", bold: "RobotoMono_700Bold" },
};

const fontAssets = {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Roboto_400Regular,
  Roboto_600SemiBold,
  RobotoMono_400Regular,
  RobotoMono_700Bold,
};

export interface UseAppFontsResult {
  fontsLoaded: boolean;
  fontError: Error | null;
}

/**
 * Hook que carrega as fontes da T-201 via `expo-font`/`@expo-google-fonts`.
 * Não testável sem nativo (AC-201-03 é `MAN`).
 */
export function useAppFonts(): UseAppFontsResult {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  return { fontsLoaded, fontError: fontError ?? null };
}

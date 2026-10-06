import { fontFamilies } from "./fonts";

export type TypographyRole =
  | "header"
  | "tabLabel"
  | "screenTitle"
  | "sectionTitle"
  | "cardTitle"
  | "body"
  | "button"
  | "tag"
  | "time"
  | "timerPlayer"
  | "childPrompt"
  | "answerOption"
  | "title"
  | "eyebrow"
  | "section"
  | "small";

export interface TypographyStyle {
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  letterSpacing?: number;
  textTransform?: "uppercase";
  fontWeight?: undefined;
}

const nunito = fontFamilies.nunito;

// Cada peso aponta para seu arquivo Nunito: Android corta texto quando fontWeight
// é combinado com uma família de fonte customizada (FX4).
export const typography: Record<TypographyRole, TypographyStyle> = {
  header: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: nunito.extraBold ?? nunito.regular,
    letterSpacing: -0.6,
  },
  tabLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: nunito.semiBold ?? nunito.regular,
  },
  screenTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: nunito.extraBold ?? nunito.regular,
    letterSpacing: -0.6,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: nunito.extraBold ?? nunito.regular,
  },
  cardTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: nunito.bold ?? nunito.regular,
  },
  body: { fontSize: 14, lineHeight: 20, fontFamily: nunito.regular },
  button: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: nunito.bold ?? nunito.regular,
  },
  tag: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: nunito.bold ?? nunito.regular,
  },
  time: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamilies.robotoMono.regular,
  },
  timerPlayer: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fontFamilies.robotoMono.regular,
  },
  childPrompt: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: nunito.bold ?? nunito.regular,
  },
  answerOption: { fontSize: 18, lineHeight: 24, fontFamily: nunito.regular },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: nunito.extraBold ?? nunito.regular,
    letterSpacing: -0.6,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: nunito.bold ?? nunito.regular,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  section: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: nunito.extraBold ?? nunito.regular,
  },
  small: { fontSize: 12, lineHeight: 16, fontFamily: nunito.regular },
};

// Tipografia da T-201 (DESIGN §4, coluna "Proposta mobile").
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
  | "answerOption";

export interface TypographyStyle {
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  fontWeight: "400" | "600" | "700";
}

export const typography: Record<TypographyRole, TypographyStyle> = {
  header: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: fontFamilies.roboto.regular,
    fontWeight: "400",
  },
  tabLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamilies.roboto.semiBold ?? fontFamilies.roboto.regular,
    fontWeight: "600",
  },
  screenTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fontFamilies.nunito.bold ?? fontFamilies.nunito.regular,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fontFamilies.nunito.bold ?? fontFamilies.nunito.regular,
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fontFamilies.nunito.bold ?? fontFamilies.nunito.regular,
    fontWeight: "700",
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamilies.nunito.regular,
    fontWeight: "400",
  },
  button: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: fontFamilies.nunito.bold ?? fontFamilies.nunito.regular,
    fontWeight: "700",
  },
  tag: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamilies.nunito.bold ?? fontFamilies.nunito.regular,
    fontWeight: "700",
  },
  time: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamilies.robotoMono.regular,
    fontWeight: "400",
  },
  timerPlayer: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fontFamilies.robotoMono.regular,
    fontWeight: "400",
  },
  childPrompt: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: fontFamilies.nunito.bold ?? fontFamilies.nunito.regular,
    fontWeight: "700",
  },
  answerOption: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fontFamilies.nunito.regular,
    fontWeight: "400",
  },
};

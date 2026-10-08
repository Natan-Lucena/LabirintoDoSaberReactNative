import type { ReactElement } from "react";
import Markdown from "react-native-markdown-display";

import { color, fontFamilies } from "@/theme";

// G-40: renderização do Markdown da análise com a tipografia do tema.
const markdownStyles = {
  body: {
    color: color.ink[800],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  heading1: {
    color: color.ink[950],
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    fontSize: 20,
    lineHeight: 26,
    marginTop: 12,
  },
  heading2: {
    color: color.brand[700],
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    fontSize: 17,
    lineHeight: 23,
    marginTop: 16,
    marginBottom: 4,
  },
  heading3: {
    color: color.ink[950],
    fontFamily: fontFamilies.nunito.bold ?? fontFamilies.nunito.regular,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 12,
  },
  strong: {
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
  },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  paragraph: { marginTop: 0, marginBottom: 8 },
};

export interface AnalysisMarkdownProps {
  text: string;
}

/**
 * Mostra o Markdown devolvido pela análise com IA. O texto é dado sensível:
 * não é gravado em cache persistido nem enviado a log (AC-REL-06-03).
 */
export function AnalysisMarkdown({
  text,
}: AnalysisMarkdownProps): ReactElement {
  return <Markdown style={markdownStyles}>{text}</Markdown>;
}

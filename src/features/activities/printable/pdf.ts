import * as Print from "expo-print";

import type { PrintableContent } from "@/api/types";
import { sharePdfFromBase64 } from "@/features/reports/sharePdf";

import { buildPrintableHtml } from "./printableHtml";

export const PRINTABLE_FILE_NAME = "atividade-imprimivel.pdf";

export async function printPrintable(
  content: PrintableContent,
  childName?: string,
): Promise<void> {
  await Print.printAsync({ html: buildPrintableHtml(content, { childName }) });
}

/** Gera o PDF, compartilha e apaga o temporário. O nome da criança fica fora do arquivo. */
export async function sharePrintablePdf(
  content: PrintableContent,
  childName?: string,
): Promise<void> {
  const file = await Print.printToFileAsync({
    html: buildPrintableHtml(content, { childName }),
    base64: true,
  });
  await sharePdfFromBase64(file.base64 ?? "", PRINTABLE_FILE_NAME, {
    deleteAfterShare: true,
  });
}

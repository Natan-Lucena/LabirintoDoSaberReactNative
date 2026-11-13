import * as Print from "expo-print";

import type { Report } from "@/api/types";

import { sharePdfFromBase64 } from "../sharePdf";
import { buildReportHtml } from "./reportHtml";

export async function printReport(report: Report): Promise<void> {
  await Print.printAsync({ html: buildReportHtml(report) });
}

/** Gera o PDF, compartilha e apaga o arquivo temporário (AC-REL-02-03). */
export async function shareReportPdf(report: Report): Promise<void> {
  const file = await Print.printToFileAsync({
    html: buildReportHtml(report),
    base64: true,
  });
  await sharePdfFromBase64(file.base64 ?? "", `relatorio-${report.id}.pdf`, {
    deleteAfterShare: true,
  });
}

import * as Print from "expo-print";

import { sharePdfFromBase64 } from "../sharePdf";
import {
  buildStudentReportHtml,
  type StudentReportInput,
} from "./studentReport";

export async function printStudentReport(
  input: StudentReportInput,
): Promise<void> {
  await Print.printAsync({ html: buildStudentReportHtml(input) });
}

export async function shareStudentReport(
  input: StudentReportInput,
): Promise<void> {
  const file = await Print.printToFileAsync({
    html: buildStudentReportHtml(input),
    base64: true,
  });
  await sharePdfFromBase64(file.base64 ?? "", "relatorio-aluno.pdf");
}

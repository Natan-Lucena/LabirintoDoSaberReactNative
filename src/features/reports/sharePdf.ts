import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

/**
 * Compartilha um PDF gerado pelo `expo-print` (`printToFileAsync({ base64: true })`).
 *
 * No Expo Go (Android) o arquivo que o `expo-print` grava fica fora do escopo
 * do app: nem o `expo-sharing` ("Not allowed to read file under given URL")
 * nem uma cópia pelo `expo-file-system` conseguem lê-lo. Por isso o PDF é
 * regravado a partir do base64 no cache do próprio app antes de compartilhar.
 */
export async function sharePdfFromBase64(
  base64: string,
  fileName: string,
): Promise<void> {
  const target = new File(Paths.cache, fileName);
  target.create({ overwrite: true });
  target.write(base64, { encoding: "base64" });

  await Sharing.shareAsync(target.uri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
  });
}

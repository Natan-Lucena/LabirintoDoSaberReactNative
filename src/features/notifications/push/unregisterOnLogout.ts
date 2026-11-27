// Antes do logout (NOT-02, AC-NOT-02-02): apaga o token no servidor. Falha ou
// demora (> 5 s) não impede a saída. Precisa rodar com a sessão ainda ativa.
import { unregisterPushToken } from "@/api/endpoints/push";
import { clearSavedPushToken, getSavedPushToken } from "./tokenStore";

export const UNREGISTER_TIMEOUT_MS = 5000;

export async function unregisterPushOnLogout(): Promise<void> {
  try {
    const token = await getSavedPushToken();
    if (!token) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<void>((resolve) => {
      timer = setTimeout(resolve, UNREGISTER_TIMEOUT_MS);
    });
    try {
      await Promise.race([unregisterPushToken(token), timeout]);
    } finally {
      clearTimeout(timer);
    }
    await clearSavedPushToken();
  } catch {
    // ignorado: a saída continua
  }
}

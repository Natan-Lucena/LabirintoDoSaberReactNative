// Estado local do push por educador (cifrado por getStorage). Sem dados de paciente.
import { getActiveEducatorId, getStorage } from "@/storage/mmkv";

const PROMPTED_KEY = "push.prompted";
const TOKEN_KEY = "push.token";

async function activeStorage() {
  const educatorId = getActiveEducatorId();
  return educatorId ? getStorage(educatorId) : null;
}

export async function wasPrompted(): Promise<boolean> {
  try {
    return (await activeStorage())?.getString(PROMPTED_KEY) === "1";
  } catch {
    return false;
  }
}

export async function markPrompted(): Promise<void> {
  try {
    (await activeStorage())?.set(PROMPTED_KEY, "1");
  } catch {
    // armazenamento indisponível: o app só pergunta de novo
  }
}

export async function getSavedPushToken(): Promise<string | null> {
  try {
    return (await activeStorage())?.getString(TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
}

export async function savePushToken(token: string): Promise<void> {
  try {
    (await activeStorage())?.set(TOKEN_KEY, token);
  } catch {
    // sem armazenamento, o logout não apaga o token no servidor
  }
}

export async function clearSavedPushToken(): Promise<void> {
  try {
    (await activeStorage())?.remove(TOKEN_KEY);
  } catch {
    // ignorado
  }
}

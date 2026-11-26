// Estado local do push (cifrado por getStorage). O token é por educador; o "já
// perguntou" é do aparelho e sobrevive ao logout. Sem dados de paciente.
import { getActiveEducatorId, getStorage } from "@/storage/mmkv";

const PROMPTED_KEY = "push.prompted";
const TOKEN_KEY = "push.token";

async function activeStorage() {
  const educatorId = getActiveEducatorId();
  return educatorId ? getStorage(educatorId) : null;
}

// Fora do armazenamento por educador: o logout limpa o dele, e o app não deve
// perguntar de novo sozinho (card NOT-02 §3).
const DEVICE_STORAGE_ID = "push-device";

export async function wasPrompted(): Promise<boolean> {
  try {
    return (
      (await getStorage(DEVICE_STORAGE_ID)).getString(PROMPTED_KEY) === "1"
    );
  } catch {
    return false;
  }
}

export async function markPrompted(): Promise<void> {
  try {
    (await getStorage(DEVICE_STORAGE_ID)).set(PROMPTED_KEY, "1");
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

import * as SecureStore from "expo-secure-store";

export const AUTH_TOKEN_STORAGE_KEY = "labirinto.auth.token";

export async function getToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_STORAGE_KEY);
  return token ?? null;
}

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(AUTH_TOKEN_STORAGE_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_STORAGE_KEY);
}

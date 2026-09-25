import { create } from "zustand";

import { clearToken, getToken, saveToken } from "@/features/auth/token-storage";

export type AuthStatus = "idle" | "authenticated" | "unauthenticated";

export type AuthClearedReason = "logout" | "sessionExpired";

export type AuthClearedEvent = { reason: AuthClearedReason };

export type AuthState = {
  status: AuthStatus;
  token: string | null;
  educatorId: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  expireSession: () => Promise<void>;
  hydrate: () => Promise<void>;
};

type AuthClearedListener = (event: AuthClearedEvent) => void;

const authClearedListeners = new Set<AuthClearedListener>();

function notifyAuthCleared(reason: AuthClearedReason): void {
  authClearedListeners.forEach((listener) => listener({ reason }));
}

async function clearSession(reason: AuthClearedReason): Promise<void> {
  await clearToken();
  useAuthStore.setState({
    status: "unauthenticated",
    token: null,
    educatorId: null,
  });
  notifyAuthCleared(reason);
}

export const useAuthStore = create<AuthState>(() => ({
  status: "idle",
  token: null,
  educatorId: null,
  login: async (token: string) => {
    await saveToken(token);
    useAuthStore.setState({ status: "authenticated", token });
  },
  logout: async () => {
    await clearSession("logout");
  },
  expireSession: async () => {
    await clearSession("sessionExpired");
  },
  hydrate: async () => {
    const token = await getToken();
    useAuthStore.setState({
      status: token ? "authenticated" : "unauthenticated",
      token,
    });
  },
}));

export function subscribeAuthCleared(
  listener: AuthClearedListener,
): () => void {
  authClearedListeners.add(listener);

  return () => {
    authClearedListeners.delete(listener);
  };
}

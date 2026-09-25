// Ponto único de inicialização da camada de mocks (G-29). Chamado por
// src/app-shell/AppProviders.tsx (T-502, edição serial de uma linha).
import { apiClient } from "@/api/client";
import { getRuntimeUseMocks } from "@/config/env";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/handlers/educator";

let installed = false;

export function installApiMocks(): void {
  if (installed || !getRuntimeUseMocks()) {
    return;
  }

  apiClient.defaults.adapter = mockAdapter;
  installed = true;
}

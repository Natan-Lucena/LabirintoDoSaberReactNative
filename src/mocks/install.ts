// Ponto único de inicialização da camada de mocks (G-29). Chamado por
// src/app-shell/AppProviders.tsx (T-502, edição serial de uma linha).
import { apiClient } from "@/api/client";
import { getRuntimeUseMocks } from "@/config/env";
import { mockAdapter } from "@/mocks/adapter";
import {
  setMockTeamScenario,
  type MockTeamScenario,
} from "@/mocks/mock-team-state";
import "@/mocks/handlers/educator";
import "@/mocks/handlers/educator-update";
import "@/mocks/handlers/appointment";
import "@/mocks/handlers/student";
import "@/mocks/handlers/content";
import "@/mocks/handlers/notebook-create";
import "@/mocks/handlers/group-create";
import "@/mocks/handlers/task-create";
import "@/mocks/handlers/task-update";
import "@/mocks/handlers/student-create";
import "@/mocks/handlers/student-update";
import "@/mocks/handlers/notebook-delete";
import "@/mocks/handlers/task-upload-media";
import "@/mocks/handlers/group-delete";
import "@/mocks/handlers/task-delete";
import "@/mocks/handlers/notebook-update";
import "@/mocks/handlers/group-update";
import "@/mocks/handlers/ai-task";
import "@/mocks/handlers/task-batch";
import "@/mocks/handlers/session-analysis";
import "@/mocks/handlers/session-report";
import "@/mocks/handlers/anamnese";
import "@/mocks/handlers/anamnese-responses";
import "@/mocks/handlers/plans";
import "@/mocks/handlers/password";
import "@/mocks/handlers/evolution";
import "@/mocks/handlers/scales";
import "@/mocks/handlers/anamnese-summary";
import "@/mocks/handlers/reports";
import "@/mocks/handlers/notifications";
import "@/mocks/handlers/task-catalog";
import "@/mocks/handlers/clinic";
import "@/mocks/handlers/student-status";
import "@/mocks/handlers/student-shares";
import "@/mocks/handlers/appointment-series";
import "@/mocks/handlers/push";
import "@/mocks/handlers/help";

let installed = false;

/**
 * Uso manual da equipe (E5): `EXPO_PUBLIC_MOCK_TEAM=none|admin|professional`
 * escolhe o cenário inicial dos mocks (padrão: `none`, sem clínica).
 */
function applyMockTeamFromEnv(): void {
  const raw = process.env.EXPO_PUBLIC_MOCK_TEAM?.trim().toLowerCase();
  if (raw === "none" || raw === "admin" || raw === "professional") {
    setMockTeamScenario(raw as MockTeamScenario);
  }
}

export function installApiMocks(): void {
  if (installed || !getRuntimeUseMocks()) {
    return;
  }

  applyMockTeamFromEnv();

  apiClient.defaults.adapter = mockAdapter;
  installed = true;
}

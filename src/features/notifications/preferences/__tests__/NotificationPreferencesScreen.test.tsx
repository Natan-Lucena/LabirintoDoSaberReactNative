import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { ApiError } from "@/api/errors";
import * as pushApi from "@/api/endpoints/push";
import { mockAdapter } from "@/mocks/adapter";
import { resetMockPushState } from "@/mocks/handlers/push";
import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import "@/mocks/install";

vi.mock("expo-router", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));
vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));
vi.mock("../../push/support", () => ({
  PUSH_CHANNEL_ID: "lembretes",
  isPushSupported: () => false,
  loadNotifications: () => null,
  getEasProjectId: () => undefined,
}));

const { NotificationPreferencesScreen } =
  await import("../NotificationPreferencesScreen");
const { createQueryClient } = await import("@/api/query-client");
const originalAdapter = apiClient.defaults.adapter;

describe("NotificationPreferencesScreen (NOT-02)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    resetMockPushState();
  });
  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    resetMockPushState();
    vi.restoreAllMocks();
  });

  it("no Expo Go mostra o aviso e deixa editar", async () => {
    await render(<NotificationPreferencesScreen />, {
      queryClient: createQueryClient(),
    });
    expect(
      await screen.findByText(/O push só funciona no app instalado/),
    ).toBeTruthy();
    await fireEvent.press(await screen.findByLabelText("Evoluções pendentes"));
    await waitFor(async () =>
      expect(
        (await pushApi.getNotificationPreferences()).kinds.EVOLUTION_PENDING,
      ).toBe(false),
    );
  });

  it("desligar o push desabilita os tipos", async () => {
    await render(<NotificationPreferencesScreen />, {
      queryClient: createQueryClient(),
    });
    await fireEvent.press(
      await screen.findByLabelText("Receber notificações no celular"),
    );
    await waitFor(() =>
      expect(
        screen.getByLabelText("Atendimentos de hoje").props.accessibilityState
          .disabled,
      ).toBe(true),
    );
  });

  it("erro ao carregar mostra 'Tentar de novo'", async () => {
    vi.spyOn(pushApi, "getNotificationPreferences").mockRejectedValueOnce(
      new ApiError({ message: "Erro", status: 400 }),
    );
    await render(<NotificationPreferencesScreen />, {
      queryClient: createQueryClient(),
    });
    expect(
      await screen.findByText("Não foi possível carregar as preferências."),
    ).toBeTruthy();
    await fireEvent.press(screen.getByText("Tentar de novo"));
    expect(await screen.findByText("Atendimentos de hoje")).toBeTruthy();
  });

  it("falha ao salvar volta o valor e avisa", async () => {
    vi.spyOn(pushApi, "updateNotificationPreferences").mockRejectedValueOnce(
      new Error("falhou"),
    );
    await render(<NotificationPreferencesScreen />, {
      queryClient: createQueryClient(),
    });
    await fireEvent.press(await screen.findByLabelText("Revisões de plano"));
    expect(
      await screen.findByText("Não foi possível salvar. Tente de novo."),
    ).toBeTruthy();
    expect(
      screen.getByLabelText("Revisões de plano").props.accessibilityState
        .checked,
    ).toBe(true);
  });
});

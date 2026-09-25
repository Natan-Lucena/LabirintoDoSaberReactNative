import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import { mockAdapter } from "@/mocks/adapter";
import { registerMockHandler } from "@/mocks/handlers/registry";
import { MockApiError, MockNetworkError } from "@/mocks/handlers/types";
import "@/mocks/handlers/content";
import "@/mocks/handlers/task-delete";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const routerPush = vi.fn();
const routerBack = vi.fn();

vi.mock("expo-router", () => ({
  useRouter: () => ({ push: routerPush, back: routerBack }),
}));

const { TaskDetailScreen } =
  await import("@/features/content-detail/task/TaskDetailScreen");

const originalAdapter = apiClient.defaults.adapter;

function noRetryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

describe("TaskDetailScreen (UX5-A)", () => {
  beforeEach(() => {
    routerPush.mockClear();
    routerBack.mockClear();
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("mostra carregamento", async () => {
    await render(<TaskDetailScreen taskId="task-1" />, {
      queryClient: noRetryClient(),
    });
    expect(screen.getByLabelText("Carregando atividade")).toBeTruthy();
  });

  it("mostra título, enunciado, alternativas e sem material de apoio (D-02)", async () => {
    await render(<TaskDetailScreen taskId="task-1" />, {
      queryClient: noRetryClient(),
    });

    expect(
      await screen.findByRole("header", { name: "Atividade" }),
    ).toBeTruthy();
    expect(screen.getByText("Atividade de Leitura")).toBeTruthy();
    expect(screen.getByText("Qual palavra começa com a letra A?")).toBeTruthy();
    expect(screen.getByText("Abelha")).toBeTruthy();
    expect(screen.getAllByText("Correta")).toHaveLength(1);
    expect(screen.getByText("Bola")).toBeTruthy();
    expect(screen.getByText("Sem material de apoio")).toBeTruthy();
  });

  it("mostra os nomes dos arquivos de material de apoio quando existem", async () => {
    registerMockHandler({ method: "get", path: "/task/with-media" }, () => ({
      status: 200,
      data: {
        id: "with-media",
        category: "reading" as const,
        type: "multipleChoiceWithMedia" as const,
        prompt: "Ouça o áudio",
        alternatives: [{ id: "a1", text: "Ok", isCorrect: true }],
        createdAt: "2026-01-01T12:00:00.000Z",
        audioFile: "https://cdn.test/audios/faixa-1.mp3",
        imageFile: "https://cdn.test/imagens/gato.png",
      },
    }));

    await render(<TaskDetailScreen taskId="with-media" />, {
      queryClient: noRetryClient(),
    });

    expect(await screen.findByText("faixa-1.mp3")).toBeTruthy();
    expect(screen.getByText("gato.png")).toBeTruthy();
  });

  it("mostra 'Não encontrado' para id inexistente e volta (D-08)", async () => {
    await render(<TaskDetailScreen taskId="task-inexistente" />, {
      queryClient: noRetryClient(),
    });

    expect(await screen.findByText("Não encontrado")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
    expect(routerBack).toHaveBeenCalledTimes(1);
  });

  it("mostra erro recuperável com nova tentativa (D-08)", async () => {
    registerMockHandler({ method: "get", path: "/task/network-error" }, () => {
      throw new MockNetworkError();
    });

    await render(<TaskDetailScreen taskId="network-error" />, {
      queryClient: noRetryClient(),
    });

    await screen.findByRole("alert");
    expect(
      screen.getByRole("button", { name: "Tentar novamente" }),
    ).toBeTruthy();
  });

  it("editar abre 'Em breve' (D-06/AC-04)", async () => {
    await render(<TaskDetailScreen taskId="task-1" />, {
      queryClient: noRetryClient(),
    });

    await screen.findByText("Atividade de Leitura");
    await fireEvent.press(
      screen.getByRole("button", { name: "Editar Atividade" }),
    );
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/shell/coming-soon",
      params: { title: "Editar Atividade" },
    });
  });

  it("excluir pede confirmação, chama o endpoint e volta (D-05/AC-03)", async () => {
    await render(<TaskDetailScreen taskId="task-2" />, {
      queryClient: noRetryClient(),
    });

    await screen.findByText(/Atividade de/);
    await fireEvent.press(
      screen.getByRole("button", { name: "Excluir Atividade" }),
    );
    expect(screen.getByText("Excluir Atividade?")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByText("Excluir Atividade?")).toBeNull();
    expect(routerBack).not.toHaveBeenCalled();

    await fireEvent.press(
      screen.getByRole("button", { name: "Excluir Atividade" }),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(routerBack).toHaveBeenCalledTimes(1));
  });

  it("mostra erro de exclusão sem reenvio automático (AC-03/G-08)", async () => {
    registerMockHandler(
      { method: "delete", path: "/task/delete/erro-exclusao" },
      () => {
        throw new MockApiError(500, "UNEXPECTED_ERROR");
      },
    );
    registerMockHandler({ method: "get", path: "/task/erro-exclusao" }, () => ({
      status: 200,
      data: {
        id: "erro-exclusao",
        category: "reading" as const,
        type: "multipleChoice" as const,
        prompt: "Prompt de teste",
        alternatives: [{ id: "a1", text: "Ok", isCorrect: true }],
        createdAt: "2026-01-01T12:00:00.000Z",
      },
    }));

    await render(<TaskDetailScreen taskId="erro-exclusao" />, {
      queryClient: noRetryClient(),
    });

    await screen.findByText("Prompt de teste");
    await fireEvent.press(
      screen.getByRole("button", { name: "Excluir Atividade" }),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Excluir" }));

    await screen.findByRole("alert");
    expect(routerBack).not.toHaveBeenCalled();
  });
});

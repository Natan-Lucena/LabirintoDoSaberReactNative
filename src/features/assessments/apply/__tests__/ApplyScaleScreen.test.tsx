import { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Alert } from "react-native";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/handlers/student";
import {
  MOCK_SCALE_APPLICATION_DRAFT_ID,
  MOCK_SCALE_TEMPLATE_ID,
  resetMockScaleState,
  setMockScaleAiFailure,
} from "@/mocks/handlers/scales";
import { fireEvent, render, screen, waitFor } from "@/test-utils/render";

const push = vi.fn();
const back = vi.fn();
const replace = vi.fn();

vi.mock("expo-router", () => ({ useRouter: () => ({ push, back, replace }) }));
vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const { ApplyScaleScreen } = await import("../ApplyScaleScreen");

const originalAdapter = apiClient.defaults.adapter;
let requests: { method: string; url: string; data: unknown }[] = [];
let failNextPut = false;
let incompleteItemId: string | null = null;

function useRecordingAdapter() {
  apiClient.defaults.adapter = async (config) => {
    requests.push({
      method: (config.method ?? "get").toLowerCase(),
      url: config.url ?? "",
      data: config.data,
    });
    if (failNextPut && config.method?.toLowerCase() === "put") {
      failNextPut = false;
      throw new AxiosError("Network Error", AxiosError.ERR_NETWORK, config);
    }
    if (incompleteItemId && config.url?.endsWith("/complete")) {
      return {
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config,
        data: {
          message: "SCALE_INCOMPLETE",
          missingItemIds: [incompleteItemId],
        },
      };
    }
    return mockAdapter(config);
  };
}

async function reachSummary() {
  await render(
    <ApplyScaleScreen
      templateId={MOCK_SCALE_TEMPLATE_ID}
      applicationId={MOCK_SCALE_APPLICATION_DRAFT_ID}
    />,
  );
  await screen.findByText("4 de 6");
  await answer("Nunca");
  await screen.findByText("5 de 6");
  await answer("Nunca");
  await screen.findByText("6 de 6");
  await answer("Nunca");
}

const puts = () => requests.filter((request) => request.method === "put");

async function answer(label: string) {
  await fireEvent.press(screen.getByRole("button", { name: label }));
}

describe("ApplyScaleScreen (AVA-02)", () => {
  beforeEach(() => {
    push.mockClear();
    back.mockClear();
    replace.mockClear();
    requests = [];
    failNextPut = false;
    incompleteItemId = null;
    setMockScaleAiFailure(null);
    resetMockScaleState();
    useRecordingAdapter();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    resetMockScaleState();
  });

  it("sem paciente, pede para escolher antes de começar e não cria nada (AC-AVA-02-03)", async () => {
    await render(<ApplyScaleScreen templateId={MOCK_SCALE_TEMPLATE_ID} />);

    expect(await screen.findByText("Escolha o paciente")).toBeTruthy();
    expect(await screen.findByText("Lia Monteiro")).toBeTruthy();
    expect(
      requests.some((request) => request.url.includes("/scale-application")),
    ).toBe(false);
    expect(screen.queryByText(/^1 de/)).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Lia Monteiro" }));
    await fireEvent.press(
      screen.getByRole("button", { name: "Começar escala" }),
    );

    expect(await screen.findByText("1 de 6")).toBeTruthy();
    expect(
      requests.filter(
        (request) =>
          request.method === "post" &&
          request.url.includes("/scale-application"),
      ),
    ).toHaveLength(1);
  });

  it("o botão de começar fica desabilitado sem paciente escolhido", async () => {
    await render(<ApplyScaleScreen templateId={MOCK_SCALE_TEMPLATE_ID} />);
    await screen.findByText("Lia Monteiro");

    await fireEvent.press(
      screen.getByRole("button", { name: "Começar escala" }),
    );

    expect(screen.queryByText("1 de 6")).toBeNull();
    expect(requests.some((request) => request.method === "post")).toBe(false);
  });

  it("com paciente, cria o rascunho e mostra progresso, instrução e opções na ordem do servidor (AC-AVA-02-01)", async () => {
    await render(
      <ApplyScaleScreen
        templateId={MOCK_SCALE_TEMPLATE_ID}
        studentId="student-1"
      />,
    );

    expect(await screen.findByText("1 de 6")).toBeTruthy();
    expect(screen.getByText(/Marque a opção que melhor descreve/)).toBeTruthy();
    expect(screen.getByText("Item de exemplo 1")).toBeTruthy();
    const labels = ["Nunca", "Às vezes", "Frequentemente", "Muito"];
    const options = screen
      .getAllByRole("button")
      .map((button) => button.props.accessibilityLabel ?? "")
      .filter((label: string) => labels.includes(label));
    expect(options).toEqual(labels);
  });

  it("salva a resposta e só então avança o progresso (AC-AVA-02-02)", async () => {
    await render(
      <ApplyScaleScreen
        templateId={MOCK_SCALE_TEMPLATE_ID}
        studentId="student-1"
      />,
    );
    await screen.findByText("1 de 6");

    await answer("Frequentemente");

    expect(await screen.findByText("2 de 6")).toBeTruthy();
    expect(screen.getByText("Item de exemplo 2")).toBeTruthy();
    expect(puts()).toHaveLength(1);
    expect(JSON.parse(puts()[0]!.data as string)).toEqual({
      answers: [{ itemId: "mock-scale-1-item-1", value: 2 }],
    });
  });

  it("falha ao salvar não avança e oferece Tentar novamente (AC-AVA-02-04)", async () => {
    await render(
      <ApplyScaleScreen
        templateId={MOCK_SCALE_TEMPLATE_ID}
        studentId="student-1"
      />,
    );
    await screen.findByText("1 de 6");

    failNextPut = true;
    await answer("Muito");

    expect(
      await screen.findByRole("button", { name: "Tentar novamente" }),
    ).toBeTruthy();
    expect(screen.getByText("1 de 6")).toBeTruthy();
    expect(screen.queryByText("2 de 6")).toBeNull();

    await fireEvent.press(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );

    expect(await screen.findByText("2 de 6")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Tentar novamente" }),
    ).toBeNull();
    expect(puts()).toHaveLength(2);
    expect(JSON.parse(puts()[1]!.data as string)).toEqual({
      answers: [{ itemId: "mock-scale-1-item-1", value: 3 }],
    });
  });

  it("DRAFT_ALREADY_EXISTS retoma o rascunho na primeira pergunta sem resposta", async () => {
    await render(
      <ApplyScaleScreen
        templateId={MOCK_SCALE_TEMPLATE_ID}
        studentId="student-2"
      />,
    );

    expect(await screen.findByText("4 de 6")).toBeTruthy();
    expect(screen.getByText("Item de exemplo 4")).toBeTruthy();
    expect(
      requests.some((request) =>
        request.url.endsWith(
          `/scale-application/${MOCK_SCALE_APPLICATION_DRAFT_ID}`,
        ),
      ),
    ).toBe(true);
  });

  it("com applicationId carrega o rascunho sem criar outro", async () => {
    await render(
      <ApplyScaleScreen
        templateId={MOCK_SCALE_TEMPLATE_ID}
        applicationId={MOCK_SCALE_APPLICATION_DRAFT_ID}
      />,
    );

    expect(await screen.findByText("4 de 6")).toBeTruthy();
    expect(requests.some((request) => request.method === "post")).toBe(false);
  });

  it("volta à pergunta anterior, mostra a resposta salva e permite trocá-la", async () => {
    await render(
      <ApplyScaleScreen
        templateId={MOCK_SCALE_TEMPLATE_ID}
        studentId="student-1"
      />,
    );
    await screen.findByText("1 de 6");
    await answer("Às vezes");
    await screen.findByText("2 de 6");

    await fireEvent.press(screen.getByRole("button", { name: /Voltar/ }));

    expect(await screen.findByText("1 de 6")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Às vezes" }).props.accessibilityState,
    ).toMatchObject({ selected: true });

    await answer("Nunca");

    expect(await screen.findByText("2 de 6")).toBeTruthy();
    expect(JSON.parse(puts()[1]!.data as string)).toEqual({
      answers: [{ itemId: "mock-scale-1-item-1", value: 0 }],
    });
    expect(back).not.toHaveBeenCalled();
  });

  it("na primeira pergunta, o voltar do cabeçalho sai da tela", async () => {
    await render(
      <ApplyScaleScreen
        templateId={MOCK_SCALE_TEMPLATE_ID}
        studentId="student-1"
      />,
    );
    await screen.findByText("1 de 6");

    await fireEvent.press(screen.getByRole("button", { name: /Voltar/ }));

    expect(back).toHaveBeenCalled();
  });

  it("no fim mostra escore do servidor e aviso clínico, e salvar rascunho volta ao hub (AC-AVA-03-01, AC-AVA-03-02, AC-AVA-05-01)", async () => {
    await reachSummary();

    expect(await screen.findByText("Pontuação")).toBeTruthy();
    expect(screen.getByText(/não substitui avaliação clínica/i)).toBeTruthy();
    expect(screen.getByText("6/6 respondidas")).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar rascunho" }),
    );
    await waitFor(() => expect(replace).toHaveBeenCalled());
  });

  it("concluir chama o servidor e leva ao resultado (AC-AVA-03-03)", async () => {
    await reachSummary();
    await screen.findByText("Pontuação");

    await fireEvent.press(
      screen.getByRole("button", { name: "Concluir escala" }),
    );

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith({
        pathname: "/assessments/results/[id]",
        params: { id: MOCK_SCALE_APPLICATION_DRAFT_ID },
      }),
    );
    expect(
      requests.some(
        (request) =>
          request.method === "post" && request.url.endsWith("/complete"),
      ),
    ).toBe(true);
  });

  it("SCALE_INCOMPLETE leva ao primeiro item faltante (AC-AVA-03-03)", async () => {
    await reachSummary();
    await screen.findByText("Pontuação");
    incompleteItemId = "mock-scale-1-item-2";

    await fireEvent.press(
      screen.getByRole("button", { name: "Concluir escala" }),
    );

    expect(await screen.findByText("2 de 6")).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
  });

  it("gera o insight pelo botão; se a IA falha, ainda dá para concluir (AC-AVA-03-04)", async () => {
    await reachSummary();
    await screen.findByText("Pontuação");

    await fireEvent.press(
      screen.getByRole("button", { name: "Gerar insight" }),
    );
    expect(await screen.findByText("Insight preliminar")).toBeTruthy();
    expect(screen.getByText(/sem diagnóstico/)).toBeTruthy();

    setMockScaleAiFailure("AI_GENERATION_FAILED");
    await fireEvent.press(
      screen.getByRole("button", { name: "Gerar insight de novo" }),
    );
    expect(await screen.findByRole("alert")).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Concluir escala" }),
    );
    await waitFor(() => expect(replace).toHaveBeenCalled());
  });

  it("descartar pede confirmação e apaga o rascunho (AC-AVA-05-02)", async () => {
    const alert = vi
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _message, buttons) => {
        buttons?.find((button) => button.style === "destructive")?.onPress?.();
      });
    await reachSummary();
    await screen.findByText("Pontuação");

    await fireEvent.press(
      screen.getByRole("button", { name: "Descartar rascunho" }),
    );

    expect(alert).toHaveBeenCalled();
    await waitFor(() => expect(replace).toHaveBeenCalled());
    expect(
      requests.some(
        (request) =>
          request.method === "delete" &&
          request.url.endsWith(
            `/scale-application/${MOCK_SCALE_APPLICATION_DRAFT_ID}`,
          ),
      ),
    ).toBe(true);
    alert.mockRestore();
  });

  it("mostra erro ao carregar e tenta de novo", async () => {
    apiClient.defaults.adapter = async (config) => {
      throw new AxiosError("Network Error", AxiosError.ERR_NETWORK, config);
    };
    await render(
      <ApplyScaleScreen
        templateId={MOCK_SCALE_TEMPLATE_ID}
        studentId="student-1"
      />,
      {
        queryClient: new QueryClient({
          defaultOptions: { queries: { retry: false } },
        }),
      },
    );

    expect(
      await screen.findByText("Não foi possível abrir a escala."),
    ).toBeTruthy();

    useRecordingAdapter();
    await fireEvent.press(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );

    expect(await screen.findByText("1 de 6")).toBeTruthy();
  });
});

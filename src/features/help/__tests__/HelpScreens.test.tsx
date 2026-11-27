import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { mockAdapter } from "@/mocks/adapter";
import { MOCK_TOKEN } from "@/mocks/fixtures";
import { setMockHelpScenario } from "@/mocks/handlers/help";
import { clearMockSession, setMockSession } from "@/mocks/mock-auth-state";
import { fireEvent, render, screen } from "@/test-utils/render";

const routerPush = vi.fn();
let routeParams: { id: string } = { id: "mock-tutorial-1" };
let statusListener: ((payload: { status: string }) => void) | null = null;

vi.mock("expo-router", () => ({
  useRouter: () => ({ push: routerPush, back: vi.fn() }),
  useLocalSearchParams: () => routeParams,
}));
vi.mock("expo-video", async () => {
  const { View } = await import("react-native");
  return {
    useVideoPlayer: () => ({
      addListener: (
        _event: string,
        listener: (payload: { status: string }) => void,
      ) => {
        statusListener = listener;
        return { remove: vi.fn() };
      },
    }),
    VideoView: (props: { accessibilityLabel?: string }) => (
      <View accessibilityLabel={props.accessibilityLabel} />
    ),
  };
});
vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));
let mockOnline = true;
vi.mock("@/hooks/useOnline", () => ({ useOnline: () => mockOnline }));

const { HelpScreen } = await import("../HelpScreen");
const { HelpTutorialScreen } = await import("../HelpTutorialScreen");

describe("Central de ajuda (AJD-01)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    setMockSession(MOCK_TOKEN);
    setMockHelpScenario("default");
    routerPush.mockClear();
    statusListener = null;
    mockOnline = true;
  });
  afterEach(() => {
    vi.restoreAllMocks();
    clearMockSession();
    setMockHelpScenario("default");
  });

  it("lista o destaque separado e os demais na ordem do servidor (AC-AJD-01-01)", async () => {
    await render(<HelpScreen />);

    expect(await screen.findByText("COMECE POR AQUI · 4 MIN")).toBeTruthy();
    expect(screen.getByText("Tutoriais essenciais")).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: "Tutorial 1: Cadastre um paciente, 3 minutos",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: "Tutorial 2: Monte um caderno de atividades, 3 minutos",
      }),
    ).toBeTruthy();

    await fireEvent.press(
      screen.getByRole("button", {
        name: "Tutorial 1: Cadastre um paciente, 3 minutos",
      }),
    );
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/help/[id]",
      params: { id: "mock-tutorial-2" },
    });
  });

  it("lista vazia mostra o aviso amigável", async () => {
    setMockHelpScenario("empty");
    await render(<HelpScreen />);

    expect(
      await screen.findByText("Os tutoriais ainda não foram publicados."),
    ).toBeTruthy();
  });

  it("erro do servidor mostra mensagem amigável e Tentar de novo", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("boom"));
    await render(<HelpScreen />);

    expect(
      await screen.findByText(
        "Não foi possível carregar a central de ajuda.",
        undefined,
        {
          timeout: 5000,
        },
      ),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tentar de novo" })).toBeTruthy();
  });

  it("tutorial com vídeo mostra o player e os passos; erro do vídeo avisa e mantém os passos", async () => {
    await render(<HelpTutorialScreen />);

    expect(
      await screen.findByLabelText("Vídeo: Conheça o Labirinto do Saber"),
    ).toBeTruthy();
    expect(screen.getByText("Passo a passo")).toBeTruthy();
    expect(screen.getByText("Abra a aba Início.")).toBeTruthy();
    expect(
      screen.queryByText("Não foi possível tocar o vídeo agora."),
    ).toBeNull();

    const { act } = await import("@testing-library/react-native");
    await act(async () => {
      statusListener?.({ status: "error" });
    });
    expect(
      screen.getByText("Não foi possível tocar o vídeo agora."),
    ).toBeTruthy();
    expect(screen.getByText("Toque em Iniciar sessão.")).toBeTruthy();
  });

  it("tutorial sem vídeo mostra só os passos numerados", async () => {
    routeParams = { id: "mock-tutorial-3" };
    await render(<HelpTutorialScreen />);

    expect(await screen.findByText("Passo a passo")).toBeTruthy();
    expect(screen.getByText("3.")).toBeTruthy();
    expect(screen.queryByLabelText(/^Vídeo:/)).toBeNull();
    routeParams = { id: "mock-tutorial-1" };
  });

  it("id que saiu da lista mostra Tutorial não encontrado", async () => {
    routeParams = { id: "inexistente" };
    await render(<HelpTutorialScreen />);

    expect(await screen.findByText("Tutorial não encontrado")).toBeTruthy();
    routeParams = { id: "mock-tutorial-1" };
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { mockAdapter } from "@/mocks/adapter";
import { resetMockClinicState } from "@/mocks/handlers/clinic";
import { resetMockRegisteredEducators } from "@/mocks/handlers/educator";
import { resetMockTeamScenario } from "@/mocks/mock-team-state";
import { act, renderHook } from "@testing-library/react-native";
import { fireEvent, render, screen } from "@/test-utils/render";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));
const signInAndLoadEducator = vi.fn();
vi.mock("@/features/auth/useSignIn", () => ({
  signInAndLoadEducator: (values: unknown) => signInAndLoadEducator(values),
}));

const { InviteCodeStep } = await import("../InviteCodeStep");
const { useRegisterWithInvite } = await import("../useRegisterWithInvite");

const VALUES = {
  name: "Profissional Teste Nova",
  email: "nova.conta@example.test",
  password: "senha-ficticia-1",
  confirmPassword: "senha-ficticia-1",
};

describe("fluxo do convite (EQP-03)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    signInAndLoadEducator.mockReset().mockResolvedValue(undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    resetMockClinicState();
    resetMockRegisteredEducators();
    resetMockTeamScenario();
  });

  it("código com 0, O, 1 ou I mostra o formato sem chamar o servidor", async () => {
    const get = vi.spyOn(apiClient, "get");
    const onPreview = vi.fn();
    await render(<InviteCodeStep onPreview={onPreview} />);

    await fireEvent.changeText(
      screen.getByLabelText("Código do convite"),
      "abcd-0345",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Continuar" }));

    expect(
      screen.getByText("O código tem 8 letras e números (sem 0, O, 1 e I)."),
    ).toBeTruthy();
    expect(get).not.toHaveBeenCalled();
    expect(onPreview).not.toHaveBeenCalled();
  });

  it("prévia válida devolve o código normalizado (AC-EQP-03-01)", async () => {
    const onPreview = vi.fn();
    await render(<InviteCodeStep onPreview={onPreview} />);

    await fireEvent.changeText(
      screen.getByLabelText("Código do convite"),
      "ab3k-7mpq",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Continuar" }));

    await vi.waitFor(() => expect(onPreview).toHaveBeenCalledTimes(1));
    expect(onPreview.mock.calls[0][0]).toBe("AB3K7MPQ");
    expect(onPreview.mock.calls[0][1]).toMatchObject({ role: "PROFESSIONAL" });
  });

  it.each([
    [
      "ZZZZ2222",
      "Convite inválido ou vencido. Peça um novo código para quem convidou você.",
    ],
    ["TENTAT22", "Muitas tentativas. Aguarde alguns minutos e tente de novo."],
  ])("código %s mostra a frase do erro (AC-EQP-03-02)", async (code, text) => {
    await render(<InviteCodeStep onPreview={vi.fn()} />);

    await fireEvent.changeText(
      screen.getByLabelText("Código do convite"),
      code,
    );
    await fireEvent.press(screen.getByRole("button", { name: "Continuar" }));

    expect(await screen.findByText(text)).toBeTruthy();
  });

  it("cadastro envia o inviteCode e entra automaticamente", async () => {
    const post = vi.spyOn(apiClient, "post");
    const { result } = await renderHook(() => useRegisterWithInvite());

    let outcome;
    await act(async () => {
      outcome = await result.current.submit(VALUES, "AB3K7MPQ");
    });

    expect(outcome).toEqual({ status: "signed-in" });
    expect(post.mock.calls[0][0]).toBe("/educator/register");
    expect(post.mock.calls[0][1]).toMatchObject({ inviteCode: "AB3K7MPQ" });
    expect(signInAndLoadEducator).toHaveBeenCalledWith({
      email: VALUES.email,
      password: VALUES.password,
    });
  });

  it("login falho depois do cadastro vai ao login, sem repetir", async () => {
    signInAndLoadEducator.mockRejectedValue(new Error("falhou"));
    const { result } = await renderHook(() => useRegisterWithInvite());

    let outcome;
    await act(async () => {
      outcome = await result.current.submit(VALUES, "AB3K7MPQ");
    });

    expect(outcome).toEqual({ status: "login-failed" });
    expect(signInAndLoadEducator).toHaveBeenCalledTimes(1);
  });

  it("convite recusado volta ao código; e-mail repetido mostra a frase", async () => {
    const { result } = await renderHook(() => useRegisterWithInvite());

    let invalid;
    await act(async () => {
      invalid = await result.current.submit(VALUES, "ZZZZ2222");
    });
    expect(invalid).toMatchObject({ status: "invite-invalid" });
    expect(signInAndLoadEducator).not.toHaveBeenCalled();

    let exists;
    await act(async () => {
      exists = await result.current.submit(
        { ...VALUES, email: "educadora.mock@labirinto.test" },
        "KM4W9RTD",
      );
    });
    expect(exists).toEqual({
      status: "error",
      message:
        "Já existe uma conta com este e-mail. Entre com ela e use 'Entrar numa equipe' no perfil.",
    });
  });
});

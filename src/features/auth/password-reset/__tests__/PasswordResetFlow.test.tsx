import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";

import { render } from "@/test-utils/render";
import { ApiError } from "@/api/errors";
import { PasswordResetFlow } from "@/features/auth/password-reset/PasswordResetFlow";
import { RESEND_COOLDOWN_SECONDS } from "@/features/auth/password-reset/usePasswordReset";

const generateToken = vi.fn();
const verifyToken = vi.fn();
const updatePassword = vi.fn();

vi.mock("@/api/endpoints/educator", () => ({
  generateToken: (...args: unknown[]) => generateToken(...args),
  verifyToken: (...args: unknown[]) => verifyToken(...args),
  updatePassword: (...args: unknown[]) => updatePassword(...args),
}));

const EMAIL = "educadora@teste.com";
const CODE = "123456";
const PASSWORD = "novaSenha1";

function apiError(code: string, status = 400): ApiError {
  return new ApiError({ message: `msg-${code}`, code, status });
}

async function sendEmail() {
  await fireEvent.changeText(screen.getByLabelText("Email"), EMAIL);
  await fireEvent.press(screen.getByRole("button", { name: "Enviar código" }));
  await screen.findByLabelText("Código de 6 dígitos");
}

async function verifyCode(code = CODE) {
  await fireEvent.changeText(
    screen.getByLabelText("Código de 6 dígitos"),
    code,
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Verificar código" }),
  );
}

async function submitPasswords(confirmation = PASSWORD) {
  await fireEvent.changeText(screen.getByLabelText("Nova senha"), PASSWORD);
  await fireEvent.changeText(
    screen.getByLabelText("Confirmar nova senha"),
    confirmation,
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Redefinir senha" }),
  );
}

async function reachPasswordStep() {
  await sendEmail();
  await verifyCode();
  await screen.findByLabelText("Nova senha");
}

describe("PasswordResetFlow (AUT-01)", () => {
  const onDone = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    generateToken.mockReset().mockResolvedValue(undefined);
    verifyToken.mockReset().mockResolvedValue({ valid: true });
    updatePassword.mockReset().mockResolvedValue(undefined);
    onDone.mockReset();
    onCancel.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("happy path: e-mail, código verificado e nova senha", async () => {
    await render(<PasswordResetFlow onDone={onDone} onCancel={onCancel} />);

    await sendEmail();
    expect(generateToken).toHaveBeenCalledWith({ email: EMAIL });
    expect(
      screen.getByText(/se o e-mail tiver cadastro, enviamos um código/i),
    ).toBeTruthy();

    await verifyCode();
    expect(verifyToken).toHaveBeenCalledWith({ email: EMAIL, token: CODE });
    expect(await screen.findByText("Código verificado")).toBeTruthy();

    await submitPasswords();

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(updatePassword).toHaveBeenCalledWith({
      email: EMAIL,
      token: CODE,
      newPassword: PASSWORD,
    });
  });

  it("AC-AUT-01-01: update-password não é chamado sem verificação do código", async () => {
    verifyToken.mockRejectedValueOnce(apiError("INVALID_TOKEN"));
    await render(<PasswordResetFlow onDone={onDone} onCancel={onCancel} />);

    await sendEmail();
    await verifyCode("000000");

    expect(await screen.findByText("msg-INVALID_TOKEN")).toBeTruthy();
    expect(screen.queryByLabelText("Nova senha")).toBeNull();
    expect(screen.queryByText("Código verificado")).toBeNull();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("exige 6 dígitos antes de verificar", async () => {
    await render(<PasswordResetFlow onDone={onDone} onCancel={onCancel} />);
    await sendEmail();

    await verifyCode("123");

    expect(
      await screen.findByText("Digite o código de 6 dígitos."),
    ).toBeTruthy();
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it("bloqueia e-mail inválido e confirmação diferente", async () => {
    await render(<PasswordResetFlow onDone={onDone} onCancel={onCancel} />);
    await fireEvent.changeText(screen.getByLabelText("Email"), "invalido");
    await fireEvent.press(
      screen.getByRole("button", { name: "Enviar código" }),
    );
    expect(await screen.findByText(/e-mail válido/i)).toBeTruthy();
    expect(generateToken).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText("Email"), EMAIL);
    await fireEvent.press(
      screen.getByRole("button", { name: "Enviar código" }),
    );
    await screen.findByLabelText("Código de 6 dígitos");
    await verifyCode();
    await screen.findByLabelText("Nova senha");

    await submitPasswords("outraSenha");
    expect(await screen.findByText(/senhas não conferem/i)).toBeTruthy();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it.each([
    ["INVALID_TOKEN", 400],
    ["EXPIRED_TOKEN", 400],
    ["TOO_MANY_ATTEMPTS", 429],
  ])(
    "AC-AUT-01-02: %s na verificação mostra a mensagem",
    async (code, status) => {
      verifyToken.mockRejectedValueOnce(apiError(code, status));
      await render(<PasswordResetFlow onDone={onDone} onCancel={onCancel} />);
      await sendEmail();
      await verifyCode();

      expect(await screen.findByText(`msg-${code}`)).toBeTruthy();
    },
  );

  it("AC-AUT-01-02: TOO_MANY_REQUESTS no envio mostra a mensagem", async () => {
    generateToken.mockRejectedValueOnce(apiError("TOO_MANY_REQUESTS", 429));
    await render(<PasswordResetFlow onDone={onDone} onCancel={onCancel} />);
    await fireEvent.changeText(screen.getByLabelText("Email"), EMAIL);
    await fireEvent.press(
      screen.getByRole("button", { name: "Enviar código" }),
    );

    expect(await screen.findByText("msg-TOO_MANY_REQUESTS")).toBeTruthy();
    expect(screen.queryByLabelText("Código de 6 dígitos")).toBeNull();
  });

  it("AC-AUT-01-02: PASSWORD_SAME_AS_OLD mantém a etapa da senha", async () => {
    updatePassword.mockRejectedValueOnce(apiError("PASSWORD_SAME_AS_OLD"));
    await render(<PasswordResetFlow onDone={onDone} onCancel={onCancel} />);
    await reachPasswordStep();

    await submitPasswords();

    expect(await screen.findByText("msg-PASSWORD_SAME_AS_OLD")).toBeTruthy();
    expect(screen.getByLabelText("Nova senha")).toBeTruthy();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("código vencido na troca volta ao passo do código", async () => {
    updatePassword.mockRejectedValueOnce(apiError("EXPIRED_TOKEN"));
    await render(<PasswordResetFlow onDone={onDone} onCancel={onCancel} />);
    await reachPasswordStep();

    await submitPasswords();

    expect(await screen.findByText("msg-EXPIRED_TOKEN")).toBeTruthy();
    expect(screen.getByLabelText("Código de 6 dígitos")).toBeTruthy();
    expect(screen.queryByLabelText("Nova senha")).toBeNull();
  });

  it("AC-AUT-01-03: voltar ao e-mail não contorna a espera de 60 s", async () => {
    await render(<PasswordResetFlow onDone={onDone} onCancel={onCancel} />);
    await sendEmail();
    expect(generateToken).toHaveBeenCalledTimes(1);

    await fireEvent.press(
      screen.getByRole("button", { name: "Alterar e-mail" }),
    );
    await fireEvent.changeText(screen.getByLabelText("Email"), EMAIL);
    await fireEvent.press(
      screen.getByRole("button", { name: "Enviar código" }),
    );

    expect(
      await screen.findByText(/aguarde \d+ s para solicitar um novo código/i),
    ).toBeTruthy();
    expect(generateToken).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText("Código de 6 dígitos")).toBeNull();
  });

  it("AC-AUT-01-03: reenvio desabilitado por 60 s com contagem visível", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    await render(<PasswordResetFlow onDone={onDone} onCancel={onCancel} />);
    await sendEmail();

    expect(RESEND_COOLDOWN_SECONDS).toBe(60);
    expect(screen.getByText(/reenviar código em 60 s/i)).toBeTruthy();
    const resend = screen.getByRole("button", { name: /reenviar código/i });
    expect(resend.props.accessibilityState?.disabled).toBe(true);
    await fireEvent.press(resend);
    expect(generateToken).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });
    expect(screen.getByText(/reenviar código em 30 s/i)).toBeTruthy();

    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });
    const enabled = screen.getByRole("button", { name: "Reenviar código" });
    expect(enabled.props.accessibilityState?.disabled).toBeFalsy();

    await fireEvent.press(enabled);
    await waitFor(() => expect(generateToken).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/reenviar código em 60 s/i)).toBeTruthy();
  });
});

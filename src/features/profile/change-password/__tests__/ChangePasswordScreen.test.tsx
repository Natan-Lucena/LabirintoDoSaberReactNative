import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { render } from "@/test-utils/render";
import { ApiError } from "@/api/errors";

const changePassword = vi.fn();
const login = vi.fn();
const back = vi.fn();

vi.mock("@/api/endpoints/educator", () => ({
  changePassword: (...args: unknown[]) => changePassword(...args),
}));
vi.mock("@/stores/auth", () => ({
  useAuthStore: {
    getState: () => ({ educatorId: "edu-1", login }),
  },
}));
vi.mock("expo-router", () => ({ useRouter: () => ({ back }) }));

const { ChangePasswordScreen } =
  await import("@/features/profile/change-password/ChangePasswordScreen");

async function fill(current = "atual123", next = "novaSenha1", confirm = next) {
  await fireEvent.changeText(screen.getByLabelText("Senha atual"), current);
  await fireEvent.changeText(screen.getByLabelText("Nova senha"), next);
  await fireEvent.changeText(
    screen.getByLabelText("Confirmar nova senha"),
    confirm,
  );
}

async function press() {
  await fireEvent.press(screen.getByRole("button", { name: "Trocar senha" }));
}

describe("ChangePasswordScreen (REC-03)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    login.mockResolvedValue(undefined);
  });

  it("AC-REC-03-01: sucesso guarda o token novo e volta ao perfil", async () => {
    changePassword.mockResolvedValue({ token: "token-novo" });
    await render(<ChangePasswordScreen />);
    await fill();
    await press();

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith("token-novo", "edu-1"),
    );
    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: "atual123",
      newPassword: "novaSenha1",
    });
    expect(await screen.findByText("Senha alterada")).toBeTruthy();
    await waitFor(() => expect(back).toHaveBeenCalled(), { timeout: 3000 });
  });

  it("AC-REC-03-02: INVALID_CURRENT_PASSWORD marca a senha atual", async () => {
    changePassword.mockRejectedValue(
      new ApiError({
        message: "A senha atual está incorreta.",
        code: "INVALID_CURRENT_PASSWORD",
        status: 400,
      }),
    );
    await render(<ChangePasswordScreen />);
    await fill();
    await press();

    expect(
      await screen.findByText("A senha atual está incorreta."),
    ).toBeTruthy();
    expect(login).not.toHaveBeenCalled();
    expect(back).not.toHaveBeenCalled();
  });

  it("PASSWORD_SAME_AS_OLD marca a nova senha", async () => {
    changePassword.mockRejectedValue(
      new ApiError({
        message: "A nova senha não pode ser igual à anterior.",
        code: "PASSWORD_SAME_AS_OLD",
        status: 400,
      }),
    );
    await render(<ChangePasswordScreen />);
    await fill("mesma123", "mesma123");
    await press();

    expect(
      await screen.findByText("A nova senha não pode ser igual à anterior."),
    ).toBeTruthy();
  });

  it("outros erros mostram a mensagem normalizada", async () => {
    changePassword.mockRejectedValue(
      new ApiError({ message: "Falha do servidor.", code: "X", status: 500 }),
    );
    await render(<ChangePasswordScreen />);
    await fill();
    await press();

    expect(await screen.findByText("Falha do servidor.")).toBeTruthy();
  });

  it("AC-REC-03-03: confirmação diferente impede o envio", async () => {
    await render(<ChangePasswordScreen />);
    await fill("atual123", "novaSenha1", "outraSenha");
    await press();

    expect(await screen.findByText("As senhas não conferem.")).toBeTruthy();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("não envia com campos vazios", async () => {
    await render(<ChangePasswordScreen />);
    await press();

    expect(await screen.findByText("Informe a senha atual.")).toBeTruthy();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("não reenvia enquanto a troca está em andamento", async () => {
    let resolve: (value: { token: string }) => void = () => undefined;
    changePassword.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    await render(<ChangePasswordScreen />);
    await fill();
    await press();

    await waitFor(() => expect(changePassword).toHaveBeenCalledTimes(1));
    await press();
    expect(changePassword).toHaveBeenCalledTimes(1);
    resolve({ token: "t" });
    await waitFor(() => expect(login).toHaveBeenCalled());
  });
});

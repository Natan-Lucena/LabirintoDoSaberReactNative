import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react-native";

import { render } from "@/test-utils/render";
import { LoginForm } from "@/features/auth/LoginForm";
import { APP_DESTINATION } from "@/features/auth/routes";

const routerReplace = vi.fn();
const routerPush = vi.fn();
const submitMock = vi.fn();
const clearFormErrorMock = vi.fn();

let formError: string | null = null;
let isSubmitting = false;

vi.mock("expo-router", () => ({
  useRouter: () => ({ replace: routerReplace, push: routerPush }),
}));

vi.mock("@/features/auth/useSignIn", () => ({
  useSignIn: () => ({
    submit: submitMock,
    isSubmitting,
    formError,
    clearFormError: clearFormErrorMock,
  }),
}));

vi.mock("@/features/auth/session-expiry", () => ({
  wasSessionExpired: () => false,
  acknowledgeSessionExpired: vi.fn(),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    routerReplace.mockClear();
    routerPush.mockClear();
    submitMock.mockReset();
    clearFormErrorMock.mockClear();
    formError = null;
    isSubmitting = false;
  });

  it("AC-401-01: blocks submit and shows field errors for invalid email/password", async () => {
    await render(<LoginForm />);

    await fireEvent.changeText(screen.getByLabelText("E-mail"), "invalido");
    await fireEvent.changeText(screen.getByLabelText("Senha"), "123");
    await fireEvent.press(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText(/e-mail válido/i)).toBeTruthy();
    expect(screen.getByText(/6 e 100/i)).toBeTruthy();
    expect(submitMock).not.toHaveBeenCalled();
  });

  it("AC-401-02: on success navigates to APP_DESTINATION", async () => {
    submitMock.mockResolvedValue(true);
    await render(<LoginForm />);

    await fireEvent.changeText(screen.getByLabelText("E-mail"), "e@x.com");
    await fireEvent.changeText(screen.getByLabelText("Senha"), "senha123");
    await fireEvent.press(screen.getByRole("button", { name: "Entrar" }));

    await screen.findByRole("button", { name: "Entrar" });
    expect(submitMock).toHaveBeenCalledWith({
      email: "e@x.com",
      password: "senha123",
    });
    expect(routerReplace).toHaveBeenCalledWith(APP_DESTINATION);
  });

  it("configura o teclado do login e envia o e-mail sem espaços externos", async () => {
    submitMock.mockResolvedValue(true);
    await render(<LoginForm />);

    const email = screen.getByLabelText("E-mail");
    const password = screen.getByLabelText("Senha");
    expect(email.props.autoCapitalize).toBe("none");
    expect(email.props.keyboardType).toBe("email-address");
    expect(email.props.autoComplete).toBe("email");
    expect(email.props.autoCorrect).toBe(false);
    expect(password.props.autoCapitalize).toBe("none");
    expect(password.props.autoCorrect).toBe(false);

    await fireEvent.changeText(email, " educadora.mock@labirinto.test ");
    await fireEvent.changeText(password, "senha123");
    await fireEvent.press(screen.getByRole("button", { name: "Entrar" }));

    expect(submitMock).toHaveBeenCalledWith({
      email: "educadora.mock@labirinto.test",
      password: "senha123",
    });
  });

  it("AC-401-05: 'Esqueceu a senha?' navigates to the forgot-password route", async () => {
    await render(<LoginForm />);

    await fireEvent.press(
      screen.getByRole("link", { name: "Esqueceu a senha?" }),
    );

    expect(routerPush).toHaveBeenCalledWith("/(auth)/forgot-password");
  });

  it("shows the formError message and a retry action when present", async () => {
    formError = "E-mail ou senha incorretos. Tente novamente.";
    await render(<LoginForm />);

    expect(screen.getByText(formError)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Tentar novamente" }),
    ).toBeTruthy();
  });

  it("AC-401-04: disables the submit button while isSubmitting", async () => {
    isSubmitting = true;
    await render(<LoginForm />);

    const button = screen.getByRole("button", { name: "Entrar" });
    expect(button.props.accessibilityState.disabled).toBe(true);
  });
});

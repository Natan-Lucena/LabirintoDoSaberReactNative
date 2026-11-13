import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react-native";

import { render } from "@/test-utils/render";
import { LoginForm } from "@/features/auth/LoginForm";
import {
  PASSWORD_CHANGED_NOTICE,
  markPasswordChanged,
  wasPasswordChanged,
} from "@/features/auth/password-reset/notice";

vi.mock("expo-router", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/features/auth/useSignIn", () => ({
  useSignIn: () => ({
    submit: vi.fn(),
    isSubmitting: false,
    formError: null,
    clearFormError: vi.fn(),
  }),
}));

vi.mock("@/features/auth/session-expiry", () => ({
  wasSessionExpired: () => false,
  acknowledgeSessionExpired: vi.fn(),
}));

describe("aviso de senha alterada no login (AUT-01)", () => {
  it("mostra o aviso uma vez e depois o limpa", async () => {
    markPasswordChanged();
    const first = await render(<LoginForm />);

    expect(
      screen.getByText("Senha alterada. Entre com a nova senha."),
    ).toBeTruthy();
    expect(PASSWORD_CHANGED_NOTICE).toBe(
      "Senha alterada. Entre com a nova senha.",
    );
    expect(wasPasswordChanged()).toBe(false);

    first.unmount();
    await render(<LoginForm />);
    expect(screen.queryByText(PASSWORD_CHANGED_NOTICE)).toBeNull();
  });
});

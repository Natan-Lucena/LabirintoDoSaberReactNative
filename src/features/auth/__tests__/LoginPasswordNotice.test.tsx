import { describe, expect, it, vi } from "vitest";
import { act, screen } from "@testing-library/react-native";

import { render } from "@/test-utils/render";
import { LoginForm } from "@/features/auth/LoginForm";
import {
  PASSWORD_CHANGED_NOTICE,
  markPasswordChanged,
  wasPasswordChanged,
} from "@/features/auth/password-reset/notice";

// Simula o foco da tela: o login fica montado por baixo da recuperação de
// senha, então o aviso precisa aparecer quando ele volta a ter foco.
const focus = vi.hoisted(() => ({
  callbacks: [] as (() => void | (() => void))[],
}));

vi.mock("expo-router", async () => {
  const { useEffect } = await import("react");
  return {
    useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
    useFocusEffect: (effect: () => void | (() => void)) => {
      useEffect(() => {
        focus.callbacks.push(effect);
        return effect();
      }, [effect]);
    },
  };
});

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
  it("aparece ao voltar o foco para um login já montado e é consumido", async () => {
    await render(<LoginForm />);
    expect(screen.queryByText(PASSWORD_CHANGED_NOTICE)).toBeNull();

    markPasswordChanged();
    await act(async () => {
      focus.callbacks.forEach((callback) => callback());
    });

    expect(screen.getByText(PASSWORD_CHANGED_NOTICE)).toBeTruthy();
    expect(PASSWORD_CHANGED_NOTICE).toBe(
      "Senha alterada. Entre com a nova senha.",
    );
    expect(wasPasswordChanged()).toBe(false);
  });

  it("não mostra o aviso em um login novo depois de consumido", async () => {
    await render(<LoginForm />);
    expect(screen.queryByText(PASSWORD_CHANGED_NOTICE)).toBeNull();
  });
});

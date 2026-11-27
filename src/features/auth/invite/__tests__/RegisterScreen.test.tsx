import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "@/test-utils/render";

const dismissTo = vi.fn();
const replace = vi.fn();
vi.mock("expo-router", () => ({
  Redirect: () => null,
  useLocalSearchParams: () => ({ code: "AB3K7MPQ" }),
  useRouter: () => ({ dismissTo, replace }),
}));
vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));
vi.mock("@/features/auth/invite/useRegisterWithInvite", () => ({
  useRegisterWithInvite: () => ({ submit: vi.fn(), isSubmitting: false }),
}));
vi.mock("@/features/auth/invite/RegisterForm", async () => {
  const { DsButton } = await import("@/components/ds");
  return {
    RegisterForm: (props: { onGoToLogin: () => void }): ReactElement => (
      <DsButton label="Ir para o login" onPress={props.onGoToLogin} />
    ),
  };
});

const { default: RegisterScreen } =
  await import("../../../../../app/(auth)/register");

describe("RegisterScreen (EQP-03)", () => {
  beforeEach(() => {
    dismissTo.mockReset();
    replace.mockReset();
  });

  it("Ir para o login volta ao login existente em vez de empilhar outro", async () => {
    await render(<RegisterScreen />);
    await fireEvent.press(
      screen.getByRole("button", { name: "Ir para o login" }),
    );

    expect(dismissTo).toHaveBeenCalledWith("/(auth)/login");
    expect(replace).not.toHaveBeenCalled();
  });
});

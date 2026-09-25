import { QueryClient } from "@tanstack/react-query";
import { fireEvent, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { render } from "@/test-utils/render";
import { useAuthStore } from "@/stores/auth";
import { useSignIn } from "@/features/auth/useSignIn";

const signInMock = vi.fn();
const getMeMock = vi.fn();
const activateEducatorMock = vi.fn();

vi.mock("@/api/endpoints/educator", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
  getMe: (...args: unknown[]) => getMeMock(...args),
}));

vi.mock("@/storage/mmkv", () => ({
  activateEducator: (...args: unknown[]) => activateEducatorMock(...args),
}));

let lastSucceeded: boolean | null = null;

function Probe() {
  const { submit, formError, isSubmitting } = useSignIn();

  return (
    <>
      <Text
        accessibilityRole="button"
        accessibilityLabel="submit"
        accessibilityState={{ disabled: isSubmitting }}
        onPress={async () => {
          lastSucceeded = await submit({
            email: "f@x.com",
            password: "senha123",
          });
        }}
      >
        submit
      </Text>
      <Text>{formError ?? "no-error"}</Text>
    </>
  );
}

function customRender() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(<Probe />, { queryClient });
}

describe("useSignIn (AC-401-02, AC-401-03, AC-401-04)", () => {
  beforeEach(() => {
    signInMock.mockReset();
    getMeMock.mockReset();
    activateEducatorMock.mockReset();
    lastSucceeded = null;
    useAuthStore.setState({
      status: "unauthenticated",
      token: null,
      educatorId: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("on success: logs in, activates the educator and clears formError", async () => {
    signInMock.mockResolvedValue({ token: "tok-1" });
    getMeMock.mockResolvedValue({
      id: "edu-1",
      name: "Fake",
      email: "f@x.com",
    });
    activateEducatorMock.mockResolvedValue(undefined);

    await customRender();
    await fireEvent.press(screen.getByLabelText("submit"));
    await screen.findByText("no-error");

    expect(lastSucceeded).toBe(true);
    expect(activateEducatorMock).toHaveBeenCalledWith("edu-1");
    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(useAuthStore.getState().educatorId).toBe("edu-1");
  });

  it("on 401 INVALID_CREDENTIALS: sets a form error and does not authenticate", async () => {
    const { ApiError } = await import("@/api/errors");
    signInMock.mockRejectedValue(
      new ApiError({ message: "INVALID_CREDENTIALS", status: 401 }),
    );

    await customRender();
    await fireEvent.press(screen.getByLabelText("submit"));
    await screen.findByText(/incorretos/i);

    expect(lastSucceeded).toBe(false);
    expect(useAuthStore.getState().status).toBe("unauthenticated");
  });

  it("on network error: sets a recoverable form error", async () => {
    const { ApiError } = await import("@/api/errors");
    signInMock.mockRejectedValue(
      new ApiError({ message: "Network Error", isNetworkError: true }),
    );

    await customRender();
    await fireEvent.press(screen.getByLabelText("submit"));
    await screen.findByText(/conectar|internet/i);

    expect(lastSucceeded).toBe(false);
  });
});

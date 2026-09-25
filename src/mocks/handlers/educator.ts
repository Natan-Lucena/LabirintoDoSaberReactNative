import {
  MOCK_EDUCATOR,
  getMockHomeScenario,
  MOCK_LAST_SESSIONS,
  MOCK_NETWORK_ERROR_EMAIL,
  MOCK_TOKEN,
  MOCK_VALID_CREDENTIALS,
} from "@/mocks/fixtures";
import { getMockSession, setMockSession } from "@/mocks/mock-auth-state";
import { registerMockHandler } from "./registry";
import { MockApiError, MockNetworkError } from "./types";

interface SignInBody {
  email?: unknown;
  password?: unknown;
}

registerMockHandler(
  { method: "post", path: "/educator/sign-in" },
  ({ body }) => {
    const { email } = (body ?? {}) as SignInBody;

    if (email === MOCK_NETWORK_ERROR_EMAIL) {
      throw new MockNetworkError();
    }

    if (email !== MOCK_VALID_CREDENTIALS.email) {
      throw new MockApiError(401, "INVALID_CREDENTIALS");
    }

    setMockSession(MOCK_TOKEN);

    return { status: 200, data: { token: MOCK_TOKEN } };
  },
);

registerMockHandler({ method: "get", path: "/educator/me" }, () => {
  if (getMockSession() !== MOCK_TOKEN) {
    throw new MockApiError(401, "UNAUTHORIZED");
  }

  return { status: 200, data: MOCK_EDUCATOR };
});

registerMockHandler(
  { method: "get", path: "/educator/get-last-sessions" },
  () => {
    if (getMockHomeScenario() === "no-sessions") {
      throw new MockApiError(404, "EDUCATOR_DOES_NOT_HAVE_SESSIONS");
    }

    return { status: 200, data: MOCK_LAST_SESSIONS };
  },
);

// Referenciado para garantir o registro no módulo de instalação.
export const educatorMockHandlersRegistered = true;

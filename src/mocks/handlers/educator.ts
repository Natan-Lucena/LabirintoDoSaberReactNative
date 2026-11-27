import {
  MOCK_EDUCATOR,
  getMockHomeScenario,
  MOCK_LAST_SESSIONS,
  MOCK_NETWORK_ERROR_EMAIL,
  MOCK_TOKEN,
  MOCK_VALID_CREDENTIALS,
} from "@/mocks/fixtures";
import { getMockSession, setMockSession } from "@/mocks/mock-auth-state";
import { getMockInviteGateway } from "@/mocks/mock-invite-state";
import { registerMockHandler } from "./registry";
import { MockApiError, MockNetworkError } from "./types";

// Contas criadas pelo `register` mockado (EQP-03): só o e-mail, em memória. O
// `sign-in` as aceita para o login automático depois do cadastro.
const registeredEmails = new Set<string>();

export function resetMockRegisteredEducators(): void {
  registeredEmails.clear();
}

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

    if (
      email !== MOCK_VALID_CREDENTIALS.email &&
      !(typeof email === "string" && registeredEmails.has(email.toLowerCase()))
    ) {
      throw new MockApiError(401, "INVALID_CREDENTIALS");
    }

    setMockSession(MOCK_TOKEN);

    return { status: 200, data: { token: MOCK_TOKEN } };
  },
);

registerMockHandler(
  { method: "post", path: "/educator/register" },
  ({ body }) => {
    const { name, email, password, inviteCode } = (body ?? {}) as Record<
      string,
      unknown
    >;

    if (
      typeof name !== "string" ||
      name.trim().length < 3 ||
      name.trim().length > 100 ||
      typeof email !== "string" ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      typeof password !== "string" ||
      password.length < 6 ||
      password.length > 100
    ) {
      throw new MockApiError(400, "VALIDATION_ERROR");
    }

    const normalizedEmail = email.toLowerCase();
    if (
      normalizedEmail === MOCK_EDUCATOR.email ||
      registeredEmails.has(normalizedEmail)
    ) {
      throw new MockApiError(400, "EDUCATOR_ALREADY_EXISTS");
    }

    // Com convite, conta e vínculo nascem juntos: código inválido não cria a conta.
    if (inviteCode !== undefined) {
      const invites = getMockInviteGateway();
      if (!invites.isValid(inviteCode)) {
        throw new MockApiError(404, "INVITE_INVALID");
      }
      invites.consume(inviteCode);
    }

    registeredEmails.add(normalizedEmail);
    return {
      status: 200,
      data: { id: `mock-educator-${registeredEmails.size + 1}`, name },
    };
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

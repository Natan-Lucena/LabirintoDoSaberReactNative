import { apiClient } from "@/api/client";
import type {
  ChangePasswordPayload,
  ChangePasswordResponse,
  Educator,
  EducatorLastSession,
  PasswordTokenSentResponse,
  ResetPasswordPayload,
  VerifyPasswordTokenPayload,
  VerifyPasswordTokenResponse,
} from "@/api/types";

/** POST /educator/sign-in */
export interface SignInInput {
  email: string;
  password: string;
}

export interface SignInOutput {
  token: string;
}

export async function signIn(input: SignInInput): Promise<SignInOutput> {
  const response = await apiClient.post<SignInOutput>(
    "/educator/sign-in",
    input,
  );

  return response.data;
}

/**
 * GET /educator/me
 *
 * `token` é usado no login, quando o token recém-emitido ainda não está na
 * store de autenticação e o interceptor não consegue anexá-lo.
 */
export async function getMe(token?: string): Promise<Educator> {
  const response = await apiClient.get<Educator>(
    "/educator/me",
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  );

  return response.data;
}

/**
 * PUT /educator/generate-token (SN-01/SN-02). Corpo `{ email }`; a resposta é
 * sempre `200 TOKEN_SENT`, exista ou não a conta, e o app a descarta.
 * `429 TOO_MANY_REQUESTS` no 4º pedido em 15 min.
 */
export interface GenerateTokenInput {
  email: string;
}

export async function generateToken(input: GenerateTokenInput): Promise<void> {
  await apiClient.put<PasswordTokenSentResponse>(
    "/educator/generate-token",
    input,
  );
}

/**
 * POST /educator/verify-token: confere o código sem consumi-lo (SN-03). Cada
 * erro conta tentativa: `400 INVALID_TOKEN`/`EXPIRED_TOKEN` e
 * `429 TOO_MANY_ATTEMPTS` no 5º erro.
 */
export async function verifyToken(
  input: VerifyPasswordTokenPayload,
): Promise<VerifyPasswordTokenResponse> {
  const response = await apiClient.post<VerifyPasswordTokenResponse>(
    "/educator/verify-token",
    input,
  );

  return response.data;
}

/**
 * POST /educator/update-password: exige o `token` (SN-04, SN-05). O sucesso é
 * `200` com o texto "OK", sem JSON: o corpo é ignorado. Depois dele, todo JWT
 * anterior dá 401, e o fluxo manda o usuário para o login.
 */
export type UpdatePasswordInput = ResetPasswordPayload;

export async function updatePassword(
  input: UpdatePasswordInput,
): Promise<void> {
  await apiClient.post<unknown>("/educator/update-password", input);
}

/**
 * PUT /educator/change-password (Bearer, SN-07). Devolve um token novo: o
 * anterior deixa de valer (SN-08), então o chamador precisa guardá-lo. Em
 * outro aparelho, o token antigo passa a dar `401 Invalid or expired token`,
 * tratado pelo interceptor do cliente como sessão expirada.
 */
export type ChangePasswordInput = ChangePasswordPayload;

export async function changePassword(
  input: ChangePasswordInput,
): Promise<ChangePasswordResponse> {
  const response = await apiClient.put<ChangePasswordResponse>(
    "/educator/change-password",
    input,
  );

  return response.data;
}

/** GET /educator/get-last-sessions */
export async function getLastSessions(): Promise<EducatorLastSession[]> {
  const response = await apiClient.get<EducatorLastSession[]>(
    "/educator/get-last-sessions",
  );

  return response.data;
}

import { apiClient } from "@/api/client";
import type {
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
 * PUT /educator/generate-token (contrato provisório, SN-01/SN-02).
 * A resposta é sempre a mesma, exista ou não a conta; o app a descarta.
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

/** POST /educator/verify-token: confere o código sem consumi-lo (SN-03). */
export async function verifyToken(
  input: VerifyPasswordTokenPayload,
): Promise<VerifyPasswordTokenResponse> {
  const response = await apiClient.post<VerifyPasswordTokenResponse>(
    "/educator/verify-token",
    input,
  );

  return response.data;
}

/** POST /educator/update-password: exige o `token` (SN-04, SN-05). */
export type UpdatePasswordInput = ResetPasswordPayload;

export async function updatePassword(
  input: UpdatePasswordInput,
): Promise<void> {
  await apiClient.post<void>("/educator/update-password", input);
}

/** GET /educator/get-last-sessions */
export async function getLastSessions(): Promise<EducatorLastSession[]> {
  const response = await apiClient.get<EducatorLastSession[]>(
    "/educator/get-last-sessions",
  );

  return response.data;
}

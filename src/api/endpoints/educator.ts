import { apiClient } from "@/api/client";
import type { Educator, EducatorLastSession } from "@/api/types";

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

/** GET /educator/me */
export async function getMe(): Promise<Educator> {
  const response = await apiClient.get<Educator>("/educator/me");

  return response.data;
}

/** PUT /educator/generate-token */
export interface GenerateTokenInput {
  educatorEmail: string;
}

export async function generateToken(input: GenerateTokenInput): Promise<void> {
  await apiClient.put<void>("/educator/generate-token", input);
}

/** POST /educator/update-password */
export interface UpdatePasswordInput {
  email: string;
  newPassword: string;
}

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

import { normalizeInviteCode } from "@/api/endpoints/clinic";

export { normalizeInviteCode };

/** 8 caracteres de A-Z e 2-9, sem 0, O, 1 e I (EQ-04), depois de normalizar. */
const INVITE_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/;

export const INVITE_CODE_LENGTH = 8;

export function isValidInviteCode(code: string): boolean {
  return INVITE_CODE_PATTERN.test(normalizeInviteCode(code));
}

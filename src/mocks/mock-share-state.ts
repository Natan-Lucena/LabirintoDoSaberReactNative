// Estado em memória do paciente compartilhado (EQP-04), mock-first: quem tem
// acesso a cada paciente, membros removidos da equipe e donos que deixaram de
// compartilhar com quem lê. Nada disto vai para a rede.
import type { StudentShare } from "@/api/types";
import { MOCK_STUDENT_SHARES } from "@/mocks/fixtures-e5";

let shares = new Map<string, StudentShare[]>();
let removedMembers = new Set<string>();

export function resetMockShareState(): void {
  shares = new Map();
  removedMembers = new Set();
}

export function getMockShares(studentId: string): StudentShare[] {
  const current = shares.get(studentId) ?? MOCK_STUDENT_SHARES[studentId] ?? [];
  return structuredClone(current).sort((a, b) =>
    a.sharedAt.localeCompare(b.sharedAt),
  );
}

export function setMockShares(
  studentId: string,
  next: StudentShare[],
): StudentShare[] {
  shares.set(studentId, structuredClone(next));
  return getMockShares(studentId);
}

/** Um membro removido da equipe perde os compartilhamentos (EQ-09). */
export function markMockMemberRemoved(educatorId: string): void {
  removedMembers.add(educatorId);
}

/** O colega saiu da equipe: o que ele compartilhou com quem lê some. */
export function isMockMemberRemoved(educatorId: string): boolean {
  return removedMembers.has(educatorId);
}

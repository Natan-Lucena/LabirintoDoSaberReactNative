const AVATAR_PALETTE = ["#E94B8F", "#9B6DD6", "#4A90E2", "#50C878"] as const;

/**
 * Cor determinística por aluno (hash do id), para manter o mesmo fundo do
 * avatar entre a lista e o detalhe (FX5).
 */
export function avatarBackgroundColorForStudentId(id: string): string {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

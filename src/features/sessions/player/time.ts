/**
 * G-07: o contrato não documenta a unidade. Mantemos milissegundos até a
 * confirmação do backend para concentrar a migração da unidade nesta borda.
 */
export function toApiTimeToAnswer(milliseconds: number): number {
  return Math.max(0, Math.floor(milliseconds));
}

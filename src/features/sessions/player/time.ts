/**
 * G-07: confirmado no backend real (2026-10-09): `timeToAnswer` é em
 * milissegundos. Esta é a única borda de conversão do envio.
 */
export function toApiTimeToAnswer(milliseconds: number): number {
  return Math.max(0, Math.floor(milliseconds));
}

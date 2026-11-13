/**
 * Divide a síntese da IA em tópicos. O backend devolve "- Tópico: ...- Outro: ..."
 * sem quebras de linha; o "- " conta como marcador no início, depois de quebra
 * de linha ou depois do fim de uma frase. Sem marcadores, devolve o texto inteiro.
 */
const BULLET = /(?:^|\n|(?<=[.!?;]))\s*-\s+/;

export function splitSummaryTopics(text: string): string[] {
  const parts = text
    .split(BULLET)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return parts;
}

/** Chave do erro "do conteúdo inteiro" no mapa de erros do formulário. */
export const CONTENT_ERROR_KEY = "content";

const PLAIN_FIELDS = new Set(["prompt", "category", "skills", "theme", "tone"]);

const CONTENT_ROOT: Record<string, string> = {
  word: "word",
  distractors: "distractors",
  hintImageUrl: "hintImage",
  hintAudioUrl: "hintAudio",
  title: "title",
  instructions: "instructions",
  layout: "layout",
};

/**
 * Converte o `field` de um erro do backend (`content.pairs.2.word`) no caminho
 * do campo do formulário (`pairs.2.word`). Só `content` (ou caminho que o app
 * não reconhece dentro de `content`) devolve `CONTENT_ERROR_KEY`; fora de
 * `content` e desconhecido devolve `null`. O backend publicado manda só o
 * primeiro nível (`content`): o app aceita os dois formatos (Q3).
 */
export function fieldFromApiPath(path: string): string | null {
  const segments = path.split(".");
  const [root, ...rest] = segments;
  if (root !== "content") {
    return root && PLAIN_FIELDS.has(root) ? root : null;
  }
  const [name, index, leaf] = rest;
  if (name === undefined) return CONTENT_ERROR_KEY;
  if (name in CONTENT_ROOT) return CONTENT_ROOT[name]!;
  if (name === "pairs" || name === "cards" || name === "items") {
    if (index === undefined) return name;
    if (name === "pairs") {
      return leaf === "word" || leaf === "colorHex"
        ? `pairs.${index}.${leaf}`
        : "pairs";
    }
    const textField = name === "cards" ? "label" : "text";
    if (leaf === undefined || leaf === textField) {
      return `${name}.${index}.${textField}`;
    }
    if (leaf === "imageUrl") return `${name}.${index}.image`;
    if (leaf === "answerLines") return "answerLines";
    return name;
  }
  return CONTENT_ERROR_KEY;
}

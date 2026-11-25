// Dados fictícios do banco de atividades (API-07, leva 1; ESPECIFICACAO-BACKEND
// §2). Biblioteca (`source: "LIBRARY"`), atividades novas do educador e as 6
// habilidades. Sem dado de criança. Mock-first: o contrato real ainda não existe.
import type { Task, TaskSkill } from "@/api/types";

/** Habilidades fictícias; `learningTopics` coerentes com os dos pacientes de `fixtures.ts`. */
export const MOCK_TASK_SKILLS: TaskSkill[] = [
  {
    code: "PHONOLOGICAL_AWARENESS",
    label: "Consciência fonológica",
    learningTopics: ["leitura", "sons das letras"],
  },
  {
    code: "LETTER_RECOGNITION",
    label: "Reconhecimento de letras",
    learningTopics: ["leitura", "alfabeto"],
  },
  {
    code: "VOCABULARY",
    label: "Vocabulário",
    learningTopics: ["vocabulário", "leitura"],
  },
  {
    code: "TEXT_COMPREHENSION",
    label: "Compreensão de texto",
    learningTopics: ["compreensão", "leitura"],
  },
  {
    code: "VISUAL_MEMORY",
    label: "Memória visual",
    learningTopics: ["atenção", "memória"],
  },
  {
    code: "FINE_MOTOR",
    label: "Coordenação motora fina",
    learningTopics: ["escrita", "coordenação motora"],
  },
];

const CREATED_AT = "2026-11-01T12:00:00.000Z";

type TaskSeed = Omit<
  Task,
  "alternatives" | "createdAt" | "format" | "source"
> & { alternatives?: Task["alternatives"] };

function library(seed: TaskSeed): Task {
  return {
    alternatives: [],
    createdAt: CREATED_AT,
    ...seed,
    format: seed.type === "printable" ? "PRINTABLE" : "INTERACTIVE",
    source: "LIBRARY",
  };
}

function educator(seed: TaskSeed): Task {
  return { ...library(seed), source: "EDUCATOR" };
}

/** Atividades prontas da plataforma (somente leitura). */
export const MOCK_LIBRARY_TASKS: Task[] = [
  library({
    id: "lib-word-bola",
    category: "writing",
    type: "wordBuilder",
    prompt: "Forme a palavra da figura",
    skills: ["LETTER_RECOGNITION", "PHONOLOGICAL_AWARENESS"],
    theme: "Brinquedos",
    tone: "mint",
    content: { kind: "wordBuilder", word: "BOLA", distractors: ["E", "M"] },
  }),
  library({
    id: "lib-word-pao",
    category: "writing",
    type: "wordBuilder",
    prompt: "Forme a palavra da figura",
    skills: ["LETTER_RECOGNITION"],
    theme: "Alimentos",
    tone: "peach",
    content: { kind: "wordBuilder", word: "PÃO", distractors: ["T", "R", "L"] },
  }),
  library({
    id: "lib-word-gato",
    category: "vocabulary",
    type: "wordBuilder",
    prompt: "Forme o nome do animal",
    skills: ["VOCABULARY", "PHONOLOGICAL_AWARENESS"],
    theme: "Animais",
    tone: "lavender",
    content: {
      kind: "wordBuilder",
      word: "GATO",
      distractors: ["S"],
      hintImageUrl: "https://example.test/biblioteca/gato.png",
    },
  }),
  library({
    id: "lib-color-1",
    category: "vocabulary",
    type: "colorMatch",
    prompt: "Associe cada palavra à sua cor",
    skills: ["VOCABULARY"],
    theme: "Cores",
    tone: "yellow",
    content: {
      kind: "colorMatch",
      pairs: [
        { id: "p1", word: "Azul", colorHex: "#2563EB" },
        { id: "p2", word: "Vermelho", colorHex: "#DC2626" },
        { id: "p3", word: "Amarelo", colorHex: "#FACC15" },
      ],
    },
  }),
  library({
    id: "lib-color-2",
    category: "vocabulary",
    type: "colorMatch",
    prompt: "Ligue o nome à cor certa",
    skills: ["VOCABULARY", "VISUAL_MEMORY"],
    theme: "Cores",
    tone: "mint",
    content: {
      kind: "colorMatch",
      pairs: [
        { id: "p1", word: "Verde", colorHex: "#16A34A" },
        { id: "p2", word: "Azul", colorHex: "#2563EB" },
        { id: "p3", word: "Vermelho", colorHex: "#DC2626" },
        { id: "p4", word: "Amarelo", colorHex: "#FACC15" },
      ],
    },
  }),
  library({
    id: "lib-color-3",
    category: "reading",
    type: "colorMatch",
    prompt: "Encontre a cor de cada palavra",
    skills: ["TEXT_COMPREHENSION"],
    tone: "peach",
    content: {
      kind: "colorMatch",
      pairs: [
        { id: "p1", word: "Verde", colorHex: "#16A34A" },
        { id: "p2", word: "Amarelo", colorHex: "#FACC15" },
        { id: "p3", word: "Azul", colorHex: "#2563EB" },
      ],
    },
  }),
  library({
    id: "lib-memory-2",
    category: "vocabulary",
    type: "memoryGame",
    prompt: "Encontre os pares iguais",
    skills: ["VISUAL_MEMORY"],
    theme: "Frutas",
    tone: "lavender",
    content: {
      kind: "memoryGame",
      cards: [
        { id: "c1", label: "Maçã" },
        { id: "c2", label: "Uva" },
      ],
    },
  }),
  library({
    id: "lib-memory-3",
    category: "vocabulary",
    type: "memoryGame",
    prompt: "Vire as cartas e ache os pares",
    skills: ["VISUAL_MEMORY", "VOCABULARY"],
    theme: "Animais",
    tone: "mint",
    content: {
      kind: "memoryGame",
      cards: [
        { id: "c1", label: "Gato" },
        { id: "c2", label: "Pato" },
        { id: "c3", label: "Rato" },
      ],
    },
  }),
  library({
    id: "lib-memory-4",
    category: "reading",
    type: "memoryGame",
    prompt: "Memória das figuras",
    skills: ["VISUAL_MEMORY"],
    theme: "Natureza",
    tone: "yellow",
    content: {
      kind: "memoryGame",
      cards: [
        {
          id: "c1",
          label: "Sol",
          imageUrl: "https://example.test/biblioteca/sol.png",
        },
        { id: "c2", label: "Lua" },
        { id: "c3", label: "Estrela" },
        { id: "c4", label: "Nuvem" },
      ],
    },
  }),
  library({
    id: "lib-print-sequence",
    category: "comprehension",
    type: "printable",
    prompt: "Complete a sequência",
    skills: ["TEXT_COMPREHENSION"],
    theme: "Sequências",
    tone: "peach",
    content: {
      kind: "printable",
      title: "Complete a sequência",
      instructions: "Escreva a letra que falta em cada sequência.",
      layout: "SEQUENCE",
      items: [
        { id: "i1", text: "A, B, __, D", answerLines: 1 },
        { id: "i2", text: "M, N, __, P", answerLines: 1 },
        { id: "i3", text: "T, U, __, X", answerLines: 1 },
      ],
    },
  }),
  library({
    id: "lib-print-list",
    category: "writing",
    type: "printable",
    prompt: "Copie as palavras",
    skills: ["FINE_MOTOR", "LETTER_RECOGNITION"],
    theme: "Caligrafia",
    tone: "mint",
    content: {
      kind: "printable",
      title: "Copie as palavras",
      instructions: "Copie cada palavra nas linhas ao lado.",
      layout: "LIST",
      items: [
        { id: "i1", text: "Casa", answerLines: 2 },
        { id: "i2", text: "Mesa", answerLines: 2 },
        { id: "i3", text: "Livro", answerLines: 2 },
      ],
    },
  }),
  library({
    id: "lib-print-grid",
    category: "vocabulary",
    type: "printable",
    prompt: "Nomeie as figuras",
    skills: ["VOCABULARY"],
    theme: "Objetos",
    tone: "lavender",
    content: {
      kind: "printable",
      title: "Nomeie as figuras",
      instructions: "Escreva o nome de cada figura.",
      layout: "GRID",
      items: [
        {
          id: "i1",
          imageUrl: "https://example.test/biblioteca/casa.png",
          answerLines: 1,
        },
        { id: "i2", text: "Bola" },
        { id: "i3", text: "Flor" },
        { id: "i4", text: "Sapo" },
      ],
    },
  }),
  library({
    id: "lib-print-list-2",
    category: "reading",
    type: "printable",
    prompt: "Leia e circule",
    skills: ["TEXT_COMPREHENSION", "PHONOLOGICAL_AWARENESS"],
    tone: "yellow",
    content: {
      kind: "printable",
      title: "Leia e circule",
      instructions: "Circule as palavras que começam com a letra B.",
      layout: "LIST",
      items: [
        { id: "i1", text: "Bola" },
        { id: "i2", text: "Casa" },
        { id: "i3", text: "Barco" },
      ],
    },
  }),
  library({
    id: "lib-print-sequence-2",
    category: "writing",
    type: "printable",
    prompt: "Ordene a história",
    skills: ["TEXT_COMPREHENSION", "FINE_MOTOR"],
    theme: "Histórias",
    tone: "mint",
    content: {
      kind: "printable",
      title: "Ordene a história",
      instructions: "Numere os quadros de 1 a 3 na ordem certa.",
      layout: "SEQUENCE",
      items: [
        { id: "i1", text: "A menina acordou.", answerLines: 1 },
        { id: "i2", text: "Ela tomou café.", answerLines: 1 },
        { id: "i3", text: "Ela foi à escola.", answerLines: 1 },
      ],
    },
  }),
  library({
    id: "lib-mc-1",
    category: "reading",
    type: "multipleChoice",
    prompt: "Qual palavra rima com 'pão'?",
    skills: ["PHONOLOGICAL_AWARENESS"],
    theme: "Rimas",
    tone: "lavender",
    alternatives: [
      { id: "lib-mc-1-a", text: "Mão", isCorrect: true },
      { id: "lib-mc-1-b", text: "Casa", isCorrect: false },
    ],
  }),
  library({
    id: "lib-mc-2",
    category: "comprehension",
    type: "multipleChoice",
    prompt: "O gato subiu no telhado. Onde o gato subiu?",
    skills: ["TEXT_COMPREHENSION"],
    tone: "peach",
    alternatives: [
      { id: "lib-mc-2-a", text: "No telhado", isCorrect: true },
      { id: "lib-mc-2-b", text: "Na mesa", isCorrect: false },
    ],
  }),
];

/** Uma de cada tipo novo, do educador logado (entram também em `GET /task/`, AT-11). */
export const MOCK_EDUCATOR_NEW_TASKS: Task[] = [
  educator({
    id: "task-word-1",
    category: "writing",
    type: "wordBuilder",
    prompt: "Forme a palavra da figura",
    skills: ["LETTER_RECOGNITION"],
    theme: "Escola",
    tone: "mint",
    content: { kind: "wordBuilder", word: "LIVRO", distractors: ["A"] },
  }),
  educator({
    id: "task-color-1",
    category: "vocabulary",
    type: "colorMatch",
    prompt: "Associe as cores",
    skills: ["VOCABULARY"],
    tone: "yellow",
    content: {
      kind: "colorMatch",
      pairs: [
        { id: "p1", word: "Verde", colorHex: "#16A34A" },
        { id: "p2", word: "Azul", colorHex: "#2563EB" },
      ],
    },
  }),
  educator({
    id: "task-memory-1",
    category: "vocabulary",
    type: "memoryGame",
    prompt: "Encontre os pares",
    skills: ["VISUAL_MEMORY"],
    theme: "Material escolar",
    tone: "lavender",
    content: {
      kind: "memoryGame",
      cards: [
        { id: "c1", label: "Lápis" },
        { id: "c2", label: "Caderno" },
      ],
    },
  }),
  educator({
    id: "task-print-1",
    category: "writing",
    type: "printable",
    prompt: "Complete a frase",
    skills: ["FINE_MOTOR"],
    tone: "peach",
    content: {
      kind: "printable",
      title: "Complete a frase",
      instructions: "Escreva a palavra que falta.",
      layout: "LIST",
      items: [{ id: "i1", text: "O ___ é azul.", answerLines: 1 }],
    },
  }),
];
